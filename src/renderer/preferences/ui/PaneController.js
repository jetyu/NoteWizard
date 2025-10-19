/**
 * 面板控制器
 * 负责 Preferences 侧边栏和面板切换
 */
import { SELECTORS, STORAGE_KEYS, PANES } from '../constants.js';
import { domCache } from '../../../utils/DOMCache.js';

export class PaneController {
  constructor(deps) {
    this.eventBus = deps.eventBus;
    this.modal = deps.modal; // ModalController 实例
    
    this.currentPane = PANES.GENERAL;
    this.isInitialized = false;
  }

  /**
   * 初始化面板控制器
   */
  init() {
    if (this.isInitialized) return;

    const modalElement = this.modal.getModal();
    if (!modalElement) {
      console.error('[PaneController] Modal not found');
      return;
    }

    this.bindEvents(modalElement);
    this.isInitialized = true;
  }

  /**
   * 绑定事件
   * @param {HTMLElement} modalElement - 模态框元素
   */
  bindEvents(modalElement) {
    const sidebar = modalElement.querySelector(SELECTORS.SIDEBAR);
    if (!sidebar) return;

    sidebar.addEventListener('click', (e) => {
      const li = e.target.closest('li[data-pane]');
      if (!li) return;

      const paneKey = li.getAttribute('data-pane');
      this.switchPane(paneKey);
    });
  }

  /**
   * 切换面板
   * @param {string} paneKey - 面板标识
   */
  switchPane(paneKey) {
    const modalElement = this.modal.getModal();
    if (!modalElement) return;

    const sidebar = modalElement.querySelector(SELECTORS.SIDEBAR);
    const sidebarItems = modalElement.querySelectorAll(SELECTORS.SIDEBAR_ITEMS);
    const panes = modalElement.querySelectorAll(SELECTORS.PANES);

    // 移除所有激活状态
    sidebarItems.forEach((li) => li.classList.remove('active'));
    panes.forEach((p) => p.classList.remove('active'));

    // 激活选中的侧边栏项
    const liToActivate = modalElement.querySelector(`.pref-sidebar li[data-pane="${paneKey}"]`);
    if (liToActivate) {
      liToActivate.classList.add('active');
    }

    // 激活对应的面板
    const paneToActivate = modalElement.querySelector(`#pane-${paneKey}`);
    if (paneToActivate) {
      paneToActivate.classList.add('active');
    }

    // 保存当前面板
    this.currentPane = paneKey;
    this.saveActivePane(paneKey);

    // 触发面板切换事件
    this.eventBus.emit('pane:switched', { paneKey });
  }

  /**
   * 恢复上次激活的面板
   */
  restoreActivePane() {
    const savedKey = this.loadActivePane();
    this.switchPane(savedKey);
  }

  /**
   * 保存激活的面板到本地存储
   * @param {string} paneKey - 面板标识
   */
  saveActivePane(paneKey) {
    try {
      localStorage.setItem(STORAGE_KEYS.PREF_ACTIVE_PANE, paneKey);
    } catch (error) {
      console.error('[PaneController] Failed to save active pane:', error);
    }
  }

  /**
   * 从本地存储加载激活的面板
   * @returns {string} 面板标识
   */
  loadActivePane() {
    try {
      return localStorage.getItem(STORAGE_KEYS.PREF_ACTIVE_PANE) || PANES.GENERAL;
    } catch (error) {
      console.error('[PaneController] Failed to load active pane:', error);
      return PANES.GENERAL;
    }
  }

  /**
   * 获取当前激活的面板
   * @returns {string}
   */
  getCurrentPane() {
    return this.currentPane;
  }

  /**
   * 重置到默认面板
   */
  reset() {
    this.switchPane(PANES.GENERAL);
  }
}
