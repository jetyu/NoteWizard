## Context

`electron/main/services` 同时承载跨功能的系统能力和具体 feature 的主进程实现。当前 Knowledge Copilot 的以下实现全部位于该根目录：

- `knowledge-copilot-conversation-context.service.ts`
- `knowledge-copilot-index.service.ts`
- `knowledge-copilot-qa.service.ts`
- `knowledge-copilot-task.service.ts`
- `knowledge-evidence-assessment.service.ts`
- `snaptium-lance-vector-store.ts`
- `vector-store.service.ts`

其中后两项虽然文件名较通用，但当前调用关系表明它们只服务于 Knowledge Copilot 索引链路。项目已在同一目录下使用 `sync/`、`import-export/` 和 `log/` 聚合多文件模块，因此本次沿用现有模式，不引入新的服务加载或注册机制。

## Goals / Non-Goals

**Goals:**

- 让 Knowledge Copilot 专属 Main Service 在单一 feature 目录内内聚。
- 降低 `electron/main/services` 根目录噪声，明确专属能力与共享能力的边界。
- 通过只移动文件和更新 import，保持所有运行行为与公开契约不变。

**Non-Goals:**

- 不重构 Knowledge Copilot 的索引、问答、Agent 或向量存储逻辑。
- 不移动通用 AI Provider、AI 配置、VFS、设置、日志或错误服务。
- 不统一整理所有单文件 Main Service。
- 不新增 barrel export、依赖注入或 service registry。
- 不更改 IPC、Preload、Renderer、数据格式或依赖项。

## Decisions

### 使用 `services/knowledge-copilot/` 作为唯一模块目录

七个专属实现原样移动到 `electron/main/services/knowledge-copilot/`，文件名和导出符号保持不变。该名称与 Renderer feature 和 IPC 模块的既有命名一致，调用方可以直接识别所属功能。

备选方案是按技术职责拆成 `vector-store/`、`agent/` 和 `retrieval/`。这些实现目前共同支撑单一 feature，进一步拆分会增加目录层级但不会形成可复用边界，因此不采用。

### 将向量存储实现视为 Knowledge Copilot 内部实现

`vector-store.service.ts` 和 `snaptium-lance-vector-store.ts` 当前仅由 Knowledge Copilot 索引服务互相调用，没有其他 feature 消费者。它们随 feature 移动，避免通用文件名在根目录暗示不存在的跨模块公共能力。

若未来出现第二个消费者，应基于实际共享接口再将稳定能力下沉，而不是在本次重组中提前抽象。

### 直接更新调用方，不保留旧路径兼容文件

更新模块内部 import、`ipc/modules/knowledge-copilot.ts` 和 `import-export/sppx-import.service.ts` 的静态 import。旧文件位置不保留转发导出，因为这些路径属于仓库内部实现，兼容代理会继续污染根目录并制造双入口。

### 不新增 `index.ts`

现有相邻模块允许调用方直接 import 明确的 service 文件。本次继续该风格，避免为了纯目录移动新增公共 API 表面；后续若项目统一 feature 出口，可单独处理。

## Risks / Trade-offs

- [遗漏静态 import 导致 Main 构建失败] → 全局搜索旧路径，并运行 `npm run build:main`。
- [把实际共享能力误归为 feature 私有] → 移动前核对所有调用方；当前向量存储实现只有 Knowledge Copilot 消费者。
- [纯移动产生难读的 Git diff] → 不修改文件内容与格式，仅更新必要的相对 import 路径。
- [与并行中的功能修改产生冲突] → 实施时先检查工作区，只处理本变更列出的文件和调用方。

## Migration Plan

1. 创建 `electron/main/services/knowledge-copilot/` 并移动七个专属文件。
2. 更新移动文件内部因目录加深而变化的跨目录 import。
3. 更新 IPC 和 SPPX 导入流程的调用路径。
4. 搜索并确认旧路径已无引用，运行 Main 构建验证。
5. 若验证失败，恢复目录位置和 import；本变更不涉及数据迁移或运行时回滚。

## Open Questions

无。当前调用关系足以确认本次七个文件的 feature 归属。
