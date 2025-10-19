/**
 * 路径设置管理器
 * 负责笔记保存路径的设置
 */
import { SELECTORS, EVENTS, STORAGE_KEYS } from '../constants.js';
import * as vfs from '../../workspace/vfs.js';

export class PathSettingsManager {
  constructor(deps) {
    this.prefsService = deps.prefsService;
    this.i18n = deps.i18n;
    this.eventBus = deps.eventBus;
    this.modal = deps.modal;
    
    this.isInitialized = false;
  }

  /**
   * 初始化
   */
  async init() {
    if (this.isInitialized) return;
    
    await this.loadSettings();
    this.bindEvents();
    
    this.isInitialized = true;
  }

  /**
   * 加载设置
   */
  async loadSettings() {
    await this.loadNoteSavePath();
  }

  /**
   * 加载笔记保存路径
   */
  async loadNoteSavePath() {
    const modalElement = this.modal.getModal();
    if (!modalElement) return;

    const pathInput = modalElement.querySelector(SELECTORS.NOTE_SAVE_PATH_INPUT);
    if (!pathInput) return;

    try {
      // 从 preferences 读取保存的路径
      let savedPath = await this.prefsService.get('noteSavePath', null);

      // 如果没有保存的路径，使用默认路径
      if (!savedPath) {
        savedPath = await this.prefsService.getDefaultSavePath();
        await this.prefsService.set('noteSavePath', savedPath);
      }

      pathInput.value = savedPath;
    } catch (error) {
      console.error('[PathSettingsManager] Failed to load noteSavePath:', error);
    }
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    const modalElement = this.modal.getModal();
    if (!modalElement) return;

    // 浏览按钮
    const browseBtn = modalElement.querySelector(SELECTORS.BROWSE_PATH_BTN);
    if (browseBtn) {
      browseBtn.addEventListener('click', async () => {
        await this.selectNoteSaveDirectory();
      });
    }

    // 路径输入框设为只读，点击时也触发浏览
    const pathInput = modalElement.querySelector(SELECTORS.NOTE_SAVE_PATH_INPUT);
    if (pathInput) {
      pathInput.readOnly = true;
      pathInput.addEventListener('click', () => {
        if (browseBtn) browseBtn.click();
      });
    }
  }

  /**
   * 选择笔记保存目录
   */
  async selectNoteSaveDirectory() {
    try {
      const modalElement = this.modal.getModal();
      const pathInput = modalElement?.querySelector(SELECTORS.NOTE_SAVE_PATH_INPUT);
      
      const currentPath = pathInput?.value || await this.prefsService.getDefaultSavePath();
      const result = await this.prefsService.selectDirectory(currentPath);

      if (result) {
        await this.saveNoteSavePath(result);
      }

      return result;
    } catch (error) {
      console.error('[PathSettingsManager] Failed to select directory:', error);
      return null;
    }
  }

  /**
   * 保存笔记路径
   */
  async saveNoteSavePath(path, showConfirmation = true) {
    if (!path) return;

    // 保存当前路径，以便在取消时恢复
    const currentPath = await this.prefsService.get('noteSavePath', null);
    if (currentPath) {
      try {
        localStorage.setItem(STORAGE_KEYS.PREVIOUS_NOTE_SAVE_PATH, currentPath);
      } catch {}
    }

    const modalElement = this.modal.getModal();
    const pathInput = modalElement?.querySelector(SELECTORS.NOTE_SAVE_PATH_INPUT);
    if (pathInput) {
      pathInput.value = path;
    }

    // 保存到 preferences
    await this.prefsService.set('noteSavePath', path);

    try {
      // 通过主进程确保目录存在
      const result = await this.prefsService.ensureDirectoryExists(path);
      if (!result.success) {
        throw new Error(result.error || '创建目录失败');
      }

      // 重新初始化工作区
      const { root } = vfs.initWorkspace(path);

      // 更新状态
      this.showStatus(`${this.t('noteSavePathUpdated')}: ${root}`);

      // 发送事件通知其他组件路径已更新
      const event = new CustomEvent(EVENTS.NOTE_SAVE_PATH_CHANGED, { 
        detail: { path: root } 
      });
      document.dispatchEvent(event);

      let confirmed = true;
      if (showConfirmation) {
        confirmed = confirm(this.t('noteSavePathUpdateConfirm'));
      }

      if (confirmed) {
        try {
          await this.prefsService.relaunchApp();
        } catch (err) {
          // 如果重启失败，回退到之前的路径
          await this.rollbackPath();
        }
      } else {
        // 用户取消重启，回退到之前的路径
        await this.rollbackPath();
      }
    } catch (error) {
      console.error('[PathSettingsManager] Failed to save path:', error);
      // 恢复之前的路径
      await this.rollbackPath();
      this.showStatus(this.t('savePathFailed'));
    }
  }

  /**
   * 回退到之前的路径
   */
  async rollbackPath() {
    const previousPath = localStorage.getItem(STORAGE_KEYS.PREVIOUS_NOTE_SAVE_PATH) || 
                        await this.prefsService.getDefaultSavePath();
    
    await this.prefsService.set('noteSavePath', previousPath);

    // 更新输入框显示
    const modalElement = this.modal.getModal();
    const pathInput = modalElement?.querySelector(SELECTORS.NOTE_SAVE_PATH_INPUT);
    if (pathInput) {
      pathInput.value = previousPath;
    }

    // 更新状态
    this.showStatus(`${this.t('cancelledKeepPath')}: ${previousPath}`);

    // 通知其他组件路径已恢复
    const event = new CustomEvent(EVENTS.NOTE_SAVE_PATH_CHANGED, { 
      detail: { path: previousPath } 
    });
    document.dispatchEvent(event);
  }

  /**
   * 获取当前保存的笔记路径
   */
  async getNoteSavePath() {
    return await this.prefsService.get('noteSavePath', '');
  }

  /**
   * 显示状态消息
   */
  showStatus(message) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  /**
   * 翻译辅助函数
   */
  t(key) {
    return this.i18n?.t ? this.i18n.t(key) : key;
  }

  /**
   * 重置到默认路径
   */
  async reset() {
    const defaultPath = await this.prefsService.getDefaultSavePath();
    await this.saveNoteSavePath(defaultPath, false);
  }
}
