## Why

自动续写当前会在内容、光标或笔记已经变化后展示基于旧上下文生成的建议，也会直接展示重复原文、缺少后文衔接或长度不合适的模型输出。用户因此无法信任建议是否针对当前写作位置，且只能整段接受或拒绝，削弱了自动续写的实际可用性。

## What Changes

- 将每次自动续写绑定到笔记、文档内容、光标与选区快照；任一条件变化时立即使旧建议和旧结果失效，并针对最新的普通输入重新计时。
- 区分普通键入、粘贴、撤销/重做、格式化、外部内容同步和 AI 建议接受，仅允许普通键入与完整接受后的连续写作信号安排预测。
- 为自动续写提供笔记标题、当前 Markdown 章节、较长的光标前局部上下文和有限的光标后上下文，并按句中、段尾和中间编辑位置选择不同续写目标。
- 调整提示词优先级，使全局语调风格和应用场景在保持连贯性的前提下生效，不再同时要求无条件严格保持原文风格。
- 在展示前清理模型返回的原文重叠，并拒绝仍明显重复最近文本、无法直接衔接或已经失效的建议。
- 保留 `Tab` 接受全部和 `Esc` 忽略，新增 `Ctrl+→` 接受下一词、`Ctrl+Shift+→` 接受下一句，并在会话首次出现建议时展示快捷键提示。
- 将接受完整建议后的固定 300ms 连续预测改为自适应安排：等待短暂观察期，仅在用户没有继续输入时按当前触发策略的较短延迟请求下一条建议。
- 补充请求时序、上下文构建、重复过滤、输入来源、部分接受和快捷键提示的回归测试。

## Capabilities

### New Capabilities

- `smart-writing-autocomplete-experience`: 定义自动续写的结果新鲜度、上下文质量、重复过滤、输入来源边界、动态续写长度、部分接受与连续预测交互。

### Modified Capabilities

无。

## Impact

- Renderer 编辑器事件与自动续写编排：`src/renderer/core/editor/`、`src/renderer/core/ai/`、`src/renderer/features/ai/`、`src/renderer/features/editor/components/EditorPane.vue`
- 自动续写 IPC 载荷与 Main 提示词：`electron/preload/`、`src/renderer/core/bridge/`、`electron/main/ipc/modules/ai-chat.ts`、`electron/main/prompts/`
- 共享 AI 类型与简体中文提示文案：`electron/shared/`、`electron/assets/locales/zh-CN.json`
- 自动续写单元测试：`tests/unit/`
- 不新增 IPC 通道、依赖或持久化设置字段；现有自动续写设置保持兼容。
