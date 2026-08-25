## Why

当前 Knowledge Agent 已使用 LangChain/LangGraph，但工具契约、HITL 恢复状态和 Renderer 结果回写仍有断点，可能造成确认写入失效、证据门禁被重置、长笔记被截断覆盖或写入成功却报告失败。需要在保持现有架构和产品行为的前提下修复这些运行时缺陷。

## What Changes

- 对齐 confirm/auto 提示词与实际 `createNote`、`updateNote` 工具名称及 HITL 行为。
- 在同一进程的中断/恢复周期内保留 Agent 业务状态和原始写入模式，并在终态清理运行时状态。
- 使用 LangChain 工具调用限制中间件实施跨 HITL 恢复的硬上限，移除无效的自定义软限制和未实现的失败限制状态。
- 恢复操作完成后统一回写最终回答、来源、会话摘要、执行记录、状态和工作区刷新。
- 明确笔记读取是否截断，并禁止 Agent 用不完整内容全量覆盖长笔记。
- 将工作区写入结果与后续索引刷新结果分离，避免索引失败把已发生的写入报告为未执行。
- 增加覆盖工具契约、HITL 恢复、调用限制、截断保护、恢复回写和部分成功语义的聚焦测试。

## Capabilities

### New Capabilities

- `langchain-agent-runtime-stability`: 定义 Knowledge Agent 的工具契约、HITL 状态连续性、调用限制、结果回写和安全写入语义。

### Modified Capabilities

- 无。

## Impact

- Main：Knowledge Copilot task service、Agent prompts、LangChain middleware 和写入后索引处理。
- Renderer：Agent pending action 的恢复结果应用与持久化。
- 测试：新增 Main Agent 纯逻辑/运行时测试和 Renderer 结果归并测试。
- 不新增依赖，不改变 IPC channel，不迁移持久化数据，不改变 Knowledge Ask 或图片 OCR 变更范围。
