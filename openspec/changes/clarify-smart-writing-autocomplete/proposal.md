## Why

“自动续写”当前只控制接受建议后的连续补全，关闭后仍会在用户输入时主动预测文字；同时，“协作策略”仍可配置首次补全的触发时机。这与用户对“自动续写”的直觉含义不一致。语调风格和应用场景也只影响自动补全，未作用于右键智能写作，与其作为全局写作偏好的产品含义不符；平铺的设置布局进一步弱化了这些作用域关系。

## What Changes

- 将“自动续写”定义为输入过程中主动预测后续文字的开关；关闭后不再产生任何输入触发的补全建议。
- 保留智能写作右键操作的独立可用性，使关闭自动续写不会禁用改写、扩写、精简、总结和翻译等主动操作。
- 将“协作策略”明确为自动续写的触发策略，并仅在智能写作与自动续写同时开启时允许配置。
- 自动续写开启时，接受建议后继续预测下一条建议，保持连续写作体验。
- 将语调风格和应用场景定义为全局写作偏好，同时应用于自动续写和右键改写、扩写、精简、总结、翻译等主动操作。
- 将智能写作设置重新划分为“基础设置”“写作偏好”“自动续写”和“快捷操作”四个功能区域，优先展示全局偏好，并调整相关简体中文名称与说明。
- 补充自动续写开关、触发策略从属行为和全局写作偏好提示词的回归测试。

## Capabilities

### New Capabilities

- `smart-writing-autocomplete`: 定义智能写作自动续写的开关语义、触发策略从属关系、与右键主动操作的边界，以及设置页的功能分区。
- `smart-writing-preferences`: 定义语调风格和应用场景作为全局偏好对自动续写与右键智能写作输出的共同约束。

### Modified Capabilities

无。

## Impact

- Renderer 自动补全编排：`src/renderer/features/ai/composables/useAiAssistant.ts`、`src/renderer/features/editor/components/EditorPane.vue`
- 智能写作设置界面：`src/renderer/features/settings/components/tabs/AIAssistantSettings.vue`
- Main 智能写作提示词与请求编排：`electron/main/prompts/`、`electron/main/ipc/modules/ai-chat.ts`
- 简体中文界面文案：`electron/assets/locales/zh-CN.json`
- 自动补全、右键菜单与提示词测试：`tests/unit/`
- 不新增 IPC、依赖或配置字段；现有 `autoContinue` 持久化字段沿用，但其用户可见语义会扩展为控制全部输入触发补全。
