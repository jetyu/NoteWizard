## ADDED Requirements

### Requirement: Knowledge Copilot Main Service 按 feature 聚合
系统 MUST 将仅供 Knowledge Copilot 使用的主进程服务与内部适配器放置在 `electron/main/services/knowledge-copilot/`，而不是散落在 `electron/main/services` 根目录。

#### Scenario: 查看 Main Service 目录
- **WHEN** 开发者查看 `electron/main/services` 的目录结构
- **THEN** Knowledge Copilot 的索引、问答、任务、会话上下文、证据评估、LanceDB 适配器和向量存储实现统一位于 `knowledge-copilot/` 子目录

### Requirement: 共享服务保持独立
系统 MUST 保持跨 feature 使用的 AI、VFS、设置、日志和错误服务独立于 Knowledge Copilot feature 目录。

#### Scenario: Knowledge Copilot 使用共享能力
- **WHEN** Knowledge Copilot 的主进程实现需要 AI Provider、VFS、设置、日志或错误处理能力
- **THEN** 它通过 import 使用现有共享服务，且不在 feature 目录中复制或迁移这些共享实现

### Requirement: 目录重组保持外部行为
系统 MUST 在目录重组后保持现有导出符号、IPC 契约、运行行为和持久化数据格式不变。

#### Scenario: Main 进程构建
- **WHEN** 所有文件移动和 import 更新完成后执行 Main 进程构建
- **THEN** 构建成功，且调用方继续使用原有服务导出而无需行为层修改

#### Scenario: 搜索旧服务路径
- **WHEN** 开发者搜索移动前的 Knowledge Copilot 服务路径
- **THEN** 仓库中不存在指向旧路径的 import 或根目录兼容转发文件
