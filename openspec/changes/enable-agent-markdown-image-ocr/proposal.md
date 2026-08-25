## Why

Knowledge Agent 的 `readNote` 工具目前只返回 Markdown 原文，因此嵌入图片对 Agent 只是路径字符串，图片中的文字和视觉信息不会进入模型上下文。Snaptium AI 的聊天模型已经具备图片识别能力，需要在不扩大文件访问范围、也不隐式切换 AI 来源的前提下，把该能力接入 Agent 的笔记读取流程。

## What Changes

- Agent 读取笔记时识别 Markdown 中由 Snaptium 管理的本地图片，并返回可供后续读取的图片清单。
- 为 Agent 增加只读的笔记图片识别工具，使用当前配置的 Agent Chat 模型发送受控的多模态请求并返回 OCR/视觉描述结果。
- 当 Agent Chat 使用 Snaptium AI 时复用其现有图片识别能力；使用其他来源时不自动改用 Snaptium AI，模型不支持图片输入时按单张图片失败并保留 Markdown 文本结果。
- 限制可读取的图片类型、大小、数量和路径范围；不自动下载远程图片，不允许通过 Markdown 路径越界读取任意本地文件。
- 在 Agent trace 中记录图片读取成功或失败，但不记录图片字节或 base64 内容。
- 本次变更仅提供 Agent 按需读取图片，不把 OCR 文本写入向量索引，也不改变 Knowledge Ask 的检索行为。

## Capabilities

### New Capabilities

- `knowledge-copilot-image-understanding`: 定义 Knowledge Agent 对 Markdown 本地图片的发现、按需识别、来源选择、失败降级和文件安全边界。

### Modified Capabilities

- 无。

## Impact

- Main：Knowledge Copilot Agent 工具、Markdown 图片引用解析、VFS 图片只读访问、AI Provider 多模态消息构造与 trace。
- 测试：Markdown 图片提取、路径/类型/大小限制、多模态请求、非视觉模型失败降级和敏感日志保护。
- Electron 边界：不新增 Renderer、Preload 或 IPC API；图片读取保持在现有 Agent Main 流程内。
- 数据与索引：不新增持久化格式，不触发 OCR 索引或索引迁移。
