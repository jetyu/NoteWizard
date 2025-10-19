# Preferences 模块重构说明

## 概述

Preferences 模块已从单一的 1068 行文件重构为模块化的面向对象架构，提升了可维护性、可测试性和可扩展性。

## 目录结构

```
src/renderer/preferences/
├── index.js                          # 模块入口，提供向后兼容 API
├── PreferencesManager.js             # 主管理器，整合所有子模块
├── constants.js                      # 常量定义
├── preferences.html                  # 模态框模板
├── services/
│   └── PreferencesService.js         # IPC 服务层，封装主进程通信
├── ui/
│   ├── ModalController.js            # 模态框控制器
│   └── PaneController.js             # 面板切换控制器
└── managers/
    ├── GeneralSettingsManager.js     # 通用设置（语言、主题、自启动）
    ├── AppearanceSettingsManager.js  # 外观设置（字体）
    ├── PathSettingsManager.js        # 路径设置
    └── AISettingsManager.js          # AI 设置
```

## 架构设计

### 1. 分层架构

```
┌─────────────────────────────────────┐
│  PreferencesManager (主管理器)       │
├─────────────────────────────────────┤
│  UI 层                               │
│  ├── ModalController                │
│  └── PaneController                 │
├─────────────────────────────────────┤
│  业务逻辑层                          │
│  ├── GeneralSettingsManager         │
│  ├── AppearanceSettingsManager      │
│  ├── PathSettingsManager            │
│  └── AISettingsManager              │
├─────────────────────────────────────┤
│  服务层                              │
│  └── PreferencesService (IPC 封装)  │
└─────────────────────────────────────┘
```

### 2. 核心原则

- **单一职责**：每个管理器只负责一个设置领域
- **依赖注入**：通过构造函数注入依赖，便于测试
- **事件驱动**：使用 EventBus 解耦模块间通信
- **服务层封装**：所有 IPC 调用通过 PreferencesService

### 3. 关键改进

- ✅ 代码行数从 1068 行降至每个文件 < 300 行
- ✅ 职责清晰，易于理解和维护
- ✅ 便于单元测试
- ✅ 易于扩展新功能
- ✅ DOM 缓存提升性能
- ✅ 统一的错误处理

## 使用方法

### 基本使用

```javascript
import { initPreferences } from './renderer/preferences/index.js';
import i18n from './renderer/i18n.js';

// 初始化
await initPreferences({ i18n });
```

### 高级使用

```javascript
import { PreferencesManager } from './renderer/preferences/index.js';

// 创建自定义实例
const prefsManager = new PreferencesManager({ i18n });
await prefsManager.init();

// 打开设置
await prefsManager.open();

// 获取笔记路径
const path = await prefsManager.getNoteSavePath();
```

### 向后兼容 API

```javascript
import { 
  getNoteSavePath, 
  ensureNoteSaveDir,
  applyImportedPreferences 
} from './renderer/preferences/index.js';

// 这些函数保持与旧版本相同的签名
const path = await getNoteSavePath();
await ensureNoteSaveDir();
await applyImportedPreferences(prefs);
```

## 扩展指南

### 添加新的设置项

1. **在 constants.js 中添加选择器和默认值**

```javascript
export const SELECTORS = {
  // ...
  NEW_SETTING_INPUT: '#new-setting',
};

export const DEFAULTS = {
  // ...
  NEW_SETTING: 'default-value',
};
```

2. **创建新的管理器（如果需要）**

```javascript
// managers/NewSettingsManager.js
export class NewSettingsManager {
  constructor(deps) {
    this.prefsService = deps.prefsService;
    this.modal = deps.modal;
  }

  async init() {
    await this.loadSettings();
    this.bindEvents();
  }

  async loadSettings() {
    const value = await this.prefsService.get('newSetting', DEFAULTS.NEW_SETTING);
    // 应用设置...
  }

  bindEvents() {
    // 绑定 UI 事件...
  }
}
```

3. **在 PreferencesManager 中集成**

```javascript
import { NewSettingsManager } from './managers/NewSettingsManager.js';

constructor(deps) {
  // ...
  this.newSettings = new NewSettingsManager(managerDeps);
}

async init() {
  // ...
  await this.newSettings.init();
}
```

## 迁移说明

### 旧代码位置

原始的 `preferences.js` 文件已被重构，但保留在项目中作为参考（可能被重命名为 `preferences.js.bak`）。

### 主要变更

1. **导入路径变更**
   ```javascript
   // 旧
   import { initPreferences } from './renderer/preferences.js';
   
   // 新
   import { initPreferences } from './renderer/preferences/index.js';
   ```

2. **初始化方式变更**
   ```javascript
   // 旧
   initPreferences();
   
   // 新
   await initPreferences({ i18n });
   ```

3. **模板位置变更**
   - 旧：`src/templates/preferences.html`
   - 新：`src/renderer/preferences/preferences.html`

### 兼容性

新模块完全向后兼容，所有导出的函数签名保持不变：
- `initPreferences()`
- `getNoteSavePath()`
- `ensureNoteSaveDir()`
- `applyImportedPreferences()`

## 测试

### 单元测试示例

```javascript
import { PreferencesService } from './services/PreferencesService.js';

// Mock ipcRenderer
const mockIpcRenderer = {
  invoke: jest.fn()
};

const service = new PreferencesService(mockIpcRenderer);

test('should get preference', async () => {
  mockIpcRenderer.invoke.mockResolvedValue('test-value');
  const result = await service.get('testKey', 'default');
  expect(result).toBe('test-value');
});
```

## 性能优化

1. **DOM 缓存**：使用 DOMCache 避免重复查询
2. **懒加载**：管理器按需初始化
3. **事件委托**：减少事件监听器数量
4. **防抖/节流**：频繁操作使用防抖

## 故障排查

### 常见问题

1. **模态框不显示**
   - 检查 `preferences.html` 是否存在
   - 检查 `TEMPLATE_PATH` 路径是否正确

2. **设置不保存**
   - 检查 IPC 通道是否正常
   - 查看控制台错误日志

3. **国际化不生效**
   - 确保传入了 `i18n` 依赖
   - 检查 `i18n.applyI18n()` 是否被调用

## 贡献指南

1. 遵循现有的代码风格
2. 每个类/函数添加 JSDoc 注释
3. 新功能需要添加测试
4. 更新此 README 文档

## 许可证

与主项目相同
