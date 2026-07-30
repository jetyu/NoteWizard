## Why

Knowledge Copilot 的主进程实现目前以多个同前缀文件散落在 `electron/main/services` 根目录，模块边界不清晰，也降低了通用 Main Service 的可发现性。项目已经对 `sync`、`import-export` 和 `log` 采用按功能聚合的目录结构，Knowledge Copilot 应遵循同一组织方式。

## What Changes

- 新建 `electron/main/services/knowledge-copilot/`，集中放置 Knowledge Copilot 的索引、问答、任务、会话上下文、证据评估、LanceDB 适配器和向量存储实现。
- 更新模块内部、IPC 模块及导入恢复流程中的相关 import 路径。
- 保持现有文件名、导出符号、IPC 通道、运行行为和持久化数据格式不变。
- 通用 AI、VFS、日志、设置等跨功能服务不纳入本次重组。

## Capabilities

### New Capabilities

- `knowledge-copilot-main-service-layout`: 约束 Knowledge Copilot 专属 Main Service 按 feature 目录聚合，同时保持现有外部行为不变。

### Modified Capabilities

无。

## Impact

- 受影响代码：`electron/main/services` 中 7 个 Knowledge Copilot 专属文件及其 import 调用方。
- 受影响调用方：Knowledge Copilot IPC 注册模块和 SPPX 导入后的索引刷新流程。
- 不涉及公开 API、IPC 契约、依赖项、数据库结构、用户数据或 UI 行为变更。
