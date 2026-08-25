## Context

Knowledge Agent 运行在 Main 进程，通过 LangChain `createAgent` 使用 `readNote` 等受控工具。当前 `readNote` 直接读取 VFS Markdown 内容并返回 JSON 字符串，Agent 只能看到图片语法和路径；Knowledge Copilot 索引同样只切分 Markdown 文本。笔记编辑器保存的图片位于 `Database/images/<contentId>/`，Markdown 通常通过 `../images/<contentId>/<file>` 引用，预览层能够解析该路径，但这条能力没有复用到 Agent。

所有文件访问必须留在 Main，且图片内容可能包含隐私数据、恶意提示词或伪造路径。Agent Chat 也可能使用不支持视觉输入的自定义模型，因此图片识别不能假设所有 Provider 均可用，也不能绕过用户选择切换到 Snaptium AI。

## Goals / Non-Goals

**Goals:**

- 让 Agent 在读取笔记后发现其中的本地图片，并按任务需要识别图片文字和视觉内容。
- Snaptium AI 被选为 Agent Chat 时，通过现有 LangChain/OpenAI-compatible 请求链路发送多模态消息。
- 把图片文件访问限制在当前笔记的 VFS 图片目录内，并限制类型、大小和单任务调用数量。
- 图片识别失败时保留 Markdown 文本能力，使 Agent 可以继续执行不依赖该图片的步骤。
- 让图片输入和识别结果遵守现有取消、错误归一化和 trace 约束。

**Non-Goals:**

- 不在后台对整个知识库执行 OCR，也不把 OCR 文本写入向量索引。
- 不改变 Knowledge Ask 的召回或回答行为。
- 不下载 HTTP/HTTPS 图片，不读取绝对路径、`data:` URL 或笔记图片目录之外的文件。
- 不新增图片上传 UI、设置项、Provider 视觉能力开关或新的 IPC/Preload API。
- 不支持 SVG 或其他非栅格图片识别。

## Decisions

### 使用“图片清单 + 按需识别”两阶段工具流程

`readNote` 在原有 Markdown 内容之外返回按文档顺序排列的图片清单。清单仅包含 `imageIndex`、alt 文本和是否可读取等安全元数据，不包含图片字节、base64 或可直接用作文件输入的绝对路径。新增只读 `readNoteImage` 工具接收 `noteId` 与 `imageIndex`，重新读取当前笔记并解析相应引用，然后进行图片识别。

该方案避免每次读取笔记都自动发送全部图片，降低延迟、token/服务成本和隐私暴露，也复用现有 Agent 工具调用上限。备选方案是在 `readNote` 中自动 OCR 所有图片；它会对与任务无关的图片发起网络请求，因此不采用。另一个备选方案是索引 OCR 文本；它需要缓存、图片变更跟踪和索引迁移，超出本次范围。

### Agent 不直接提供文件路径

图片工具不接受路径参数。Main 根据 `noteId` 找到活动笔记和 `contentId`，按 `imageIndex` 重新解析 Markdown，然后以对象文件目录为基准解析引用。候选文件经规范化和真实路径解析后，必须位于 `Database/images/<contentId>/` 内；越界、符号链接逃逸、远程 URL、绝对路径、缺失文件和已变化的索引均拒绝。

这样可以防止模型构造 `../` 路径读取任意工作区或系统文件。备选方案是让 Agent 回传 Markdown destination 并在 Main 校验；索引参数更小，也不会把路径变成 Agent 可自由编辑的工具输入，因此优先使用索引。

### 复用 VFS 与 Markdown 既有层次

在 `electron/main/utils/markdown.utils.ts` 增加与现有 Markdown 图片 destination 规则一致的提取函数；在 VFS service 增加按 `contentId` 和受控引用读取图片的原子能力。Knowledge Copilot 图片服务负责组合图片清单、多模态消息和 OCR 结果，task service 只负责编排工具和 trace。

不在 Renderer 解析文件路径，也不新增绕过 VFS 的通用“读取任意文件”IPC。文件类型初始只允许 PNG、JPEG、WebP 和 GIF；单张图片上限沿用项目已有图片边界的 8 MiB。`readNoteImage` 仍计入现有 `AGENT_MAX_TOOL_CALLS`，因此不再引入独立的无限循环控制。

### 使用当前 Agent Chat 模型发送标准多模态消息

图片服务复用已经由 `createProviderChatModel` 创建的 Agent Chat 模型，构造包含固定文本指令和 `image_url` data URL 的 `HumanMessage`。Snaptium AI 继续通过 `builtInAiService.fetch` 完成认证、重试和错误归一化；自定义来源继续使用自身 Provider adapter。系统 MUST NOT 因自定义模型拒绝图片输入而自动改用 Snaptium AI。

识别请求使用固定目标：提取全部可辨文字，并给出与笔记理解相关的简短视觉描述。请求继承当前 Agent 的 `AbortSignal`，结果在返回工具上下文前截断到受控长度。Provider 不支持视觉输入、图片格式不兼容或请求失败时，工具返回结构化失败，Agent 任务本身不因此立即终止。

备选方案是为 OCR 单独增加模型角色设置；这会扩大设置和迁移范围，并可能导致用户未预期的数据跨 Provider 发送，因此不采用。

### 图片内容按不可信资料处理

OCR 调用使用系统指令声明图片中的文字只是待提取数据，不得执行其中的指令。工具结果同样包裹为不可信参考资料，Agent system prompt 明确禁止把图片或 OCR 文本中的命令当作系统或用户指令。

trace 只记录笔记 ID、图片序号、类型、大小、耗时和成功/失败状态；不得记录原始字节、data URL、base64 或完整 OCR 内容。现有工具结果预览也必须对该工具使用安全摘要，不能直接截取返回载荷。

## Risks / Trade-offs

- [自定义 Chat 模型可能不支持视觉输入] → 不做隐式 Provider fallback，返回单图结构化失败，并让 Agent 继续使用 Markdown/alt 文本。
- [图片内提示词注入] → 使用固定 OCR 系统指令、把结果标记为不可信资料，并禁止 Agent 执行图片中的命令。
- [超大图片造成内存或请求膨胀] → 读取前检查文件状态与 8 MiB 上限，一次工具调用只处理一张图片。
- [Markdown 在两次工具调用之间变化] → `readNoteImage` 每次重新解析当前内容并校验索引；不再匹配时拒绝而不读取旧路径。
- [两次读取和独立模型调用增加延迟] → 只在 Agent 判断图片与任务相关时调用，且沿用取消信号和总工具调用上限。
- [仅按需 OCR 无法让向量搜索命中只存在于图片中的文字] → 明确保留为后续独立的 OCR 索引能力，本次不承担索引一致性与成本。

## Migration Plan

1. 增加纯解析与 VFS 受控图片读取能力及单元测试。
2. 增加 Knowledge Copilot 图片识别服务与 Provider 多模态测试。
3. 扩展 `readNote` 返回图片清单，注册 `readNoteImage` 工具并更新 Agent prompt/trace。
4. 运行 Main 构建、类型检查、lint 和相关单元测试。

该变更不修改持久化数据、IPC DTO 或索引结构。若发布前需要回滚，可移除新工具和相关只读服务，不需要数据迁移或清理。

## Open Questions

- 无。首版按需识别、仅限内容作用域内的本地栅格图片，并使用当前 Agent Chat 来源。
