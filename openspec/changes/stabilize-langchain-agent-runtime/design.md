## Context

Knowledge Agent 通过 LangChain `createAgent`、LangGraph `MemorySaver` 和 `humanInTheLoopMiddleware` 执行工具。当前 graph checkpoint 能恢复消息和中断位置，但检索证据、来源、trace、执行写入和工具计数保存在每次函数调用新建的闭包对象中；Renderer 的恢复分支也只更新局部元数据。另有两个独立安全问题：`readNote` 截断为 6000 字符但 `updateNote` 全量替换，且 VFS 写入后索引失败会让工具报告整体失败。

本次变更只修复这些接入缺陷，不替换 LangChain，不引入持久化 checkpoint、自定义 graph 框架或增量 patch 语言。

## Goals / Non-Goals

**Goals:**

- 保证同一进程内 HITL 中断前后的证据、来源、trace、写入记录和写入模式连续。
- 硬性限制一个 Agent thread 的工具调用总数，并在终态清理 checkpoint/runtime state。
- 让批准或拒绝后的结果与首次 Agent 结果采用同一套 UI 回写语义。
- 阻止基于截断内容全量覆盖长笔记。
- 准确区分工作区操作成功与索引刷新失败。
- 用聚焦测试覆盖上述回归面。

**Non-Goals:**

- 不持久化运行中 Agent checkpoint，应用重启后仍不恢复待确认任务。
- 不增加多 Agent、长期任务队列、patch DSL、文档版本合并或新的 IPC channel。
- 不改变 Knowledge Ask、向量检索策略或图片 OCR 变更。
- 不解决恶意 Renderer 的完整信任模型；仍遵循当前 Electron 应用边界。

## Decisions

### 用进程内 session map 补齐 graph checkpoint 外的业务状态

以 Agent `conversationId` 保存 `{ state, writeMode }`，新任务创建，HITL 恢复复用；终态、取消或不可恢复错误时删除 session，并调用 `MemorySaver.deleteThread`。这与当前“仅进程内恢复”的产品约束一致，改动小于自定义 LangGraph state schema，也不会引入持久化迁移。

恢复请求沿用 session 中的原始 `writeMode`，不允许 Renderer 在恢复阶段改变权限模式。返回结果使用累计 state，Renderer 用结果替换运行时字段而不是再次追加，避免重复 trace 和写入记录。

### 使用 LangChain 自带工具调用限制

使用 `toolCallLimitMiddleware` 的 `threadLimit` 和 `exitBehavior: 'error'`，使计数保存在 graph state/message history语义内并跨 HITL 恢复生效。捕获 `ToolCallLimitExceededError` 后返回明确的 `tool-call-limit` 终态。移除只返回错误字符串但不能停止 graph 的闭包计数器，以及从未实现的 `tool-failure-limit` 枚举。

### Confirm 模式仍调用真实工具名

系统提示在两种模式下都使用 `createNote` 和 `updateNote`；confirm 模式说明调用会被 HITL 暂停等待审批。保留现有工具 schema 和 middleware 权限矩阵，不增加 proposal 伪工具。

### 对长笔记采用拒绝覆盖而不是引入 patch 系统

`readNote` 返回 `truncated` 与原始长度。`updateNote` 在写入前重新读取当前内容；若超过 `AGENT_NOTE_CONTENT_LIMIT`，返回可操作错误并拒绝全量覆盖。首版不增加分段读取或 patch 工具，这是最小的数据安全修复。

### 工作区写入是主结果，索引刷新是后续结果

VFS 操作成功后立即记录 executed write/step。索引刷新失败不反转已经发生的工作区操作，也不把工具整体标记为失败；工具返回成功并附带索引警告，同时记录失败的索引步骤。后续现有自动索引/重建可以恢复一致性。

### Renderer 复用一个恢复结果终结流程

批准、编辑或拒绝后，将 `finalAnswer`、sources、conversation summary、generation status 和累计 Agent metadata 写回同一问题记录；存在 executed writes 时刷新工作区。pending actions 仍只在当前进程内保存，与 `MemorySaver` 生命周期一致。

## Risks / Trade-offs

- [进程内 session 被遗弃] → 终态主动清理；待确认任务保持现有进程内生命周期，不新增后台持久化。
- [工具调用限制异常丢失模型最终措辞] → 返回本地明确的调用上限终态，优先保证停止执行。
- [长笔记暂时无法由 Agent 修改] → 明确拒绝并保留数据；分段读取/patch 作为未来独立能力。
- [索引失败后短暂检索旧内容] → 工具明确返回警告并依赖现有自动索引或重建恢复，不谎报工作区写入失败。

## Migration Plan

1. 调整 Agent prompt 和 Main runtime/session/middleware。
2. 增加截断保护和索引警告语义。
3. 统一 Renderer 恢复结果回写。
4. 添加测试并运行 Main build、Renderer typecheck、lint 和 unit tests。

无数据迁移。回滚只需恢复代码；现有笔记、索引和设置格式不变。

## Open Questions

- 无。
