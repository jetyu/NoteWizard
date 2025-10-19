/**
 * Preferences 模块入口文件
 * 提供向后兼容的 API
 */
import { PreferencesManager } from './PreferencesManager.js';

// 全局实例
let preferencesManagerInstance = null;

/**
 * 初始化 Preferences
 * @param {Object} deps - 依赖对象 { i18n }
 * @returns {Promise<PreferencesManager>}
 */
export async function initPreferences(deps = {}) {
  if (!preferencesManagerInstance) {
    preferencesManagerInstance = new PreferencesManager(deps);
    await preferencesManagerInstance.init();
  }
  return preferencesManagerInstance;
}

/**
 * 获取 Preferences 管理器实例
 * @returns {PreferencesManager|null}
 */
export function getPreferencesManager() {
  return preferencesManagerInstance;
}

/**
 * 获取笔记保存路径
 * @returns {Promise<string>}
 */
export async function getNoteSavePath() {
  if (!preferencesManagerInstance) {
    throw new Error('PreferencesManager not initialized. Call initPreferences() first.');
  }
  return await preferencesManagerInstance.getNoteSavePath();
}

/**
 * 确保笔记保存目录存在
 * @returns {Promise<string>}
 */
export async function ensureNoteSaveDir() {
  if (!preferencesManagerInstance) {
    throw new Error('PreferencesManager not initialized. Call initPreferences() first.');
  }
  
  const { prefsService } = preferencesManagerInstance;
  let savePath = await prefsService.get('noteSavePath', null);
  
  if (!savePath) {
    savePath = await prefsService.getDefaultSavePath();
    await prefsService.set('noteSavePath', savePath);
  }

  // 确保目录存在
  const result = await prefsService.ensureDirectoryExists(savePath);
  if (!result.success) {
    throw new Error(result.error || '创建目录失败');
  }

  return savePath;
}

/**
 * 应用导入的首选项（向后兼容）
 * @param {Object} prefs - 首选项对象
 * @returns {Promise<boolean>}
 */
export async function applyImportedPreferences(prefs) {
  if (!preferencesManagerInstance) {
    throw new Error('PreferencesManager not initialized. Call initPreferences() first.');
  }
  
  try {
    await preferencesManagerInstance.applyImportedPreferences(prefs);
    return true;
  } catch (error) {
    console.error('[Preferences] Failed to apply imported preferences:', error);
    return false;
  }
}

// 导出类供高级使用
export { PreferencesManager } from './PreferencesManager.js';
export { createPreferencesService } from './services/PreferencesService.js';
