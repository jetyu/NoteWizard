/**
 * 外观设置管理器
 * 负责编辑器和预览区的字体设置
 */
import { SELECTORS, DEFAULTS, FONT_SIZE, CSS_VARS } from '../constants.js';

export class AppearanceSettingsManager {
  constructor(deps) {
    this.prefsService = deps.prefsService;
    this.eventBus = deps.eventBus;
    this.modal = deps.modal;
    
    this.isInitialized = false;
    this.eventsBound = false;
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
    // 加载并应用编辑器字体大小
    const editorFontSize = await this.prefsService.get('editorFontSize', DEFAULTS.EDITOR_FONT_SIZE);
    this.applyEditorFontSize(editorFontSize);
    
    // 加载并应用预览区字体大小
    const previewFontSize = await this.prefsService.get('previewFontSize', DEFAULTS.PREVIEW_FONT_SIZE);
    this.applyPreviewFontSize(previewFontSize);
    
    // 加载并应用编辑器字体系列
    const editorFontFamily = await this.prefsService.get('editorFontFamily', DEFAULTS.EDITOR_FONT_FAMILY);
    this.applyEditorFontFamily(editorFontFamily);
    
    // 加载并应用预览区字体系列
    const previewFontFamily = await this.prefsService.get('previewFontFamily', DEFAULTS.PREVIEW_FONT_FAMILY);
    this.applyPreviewFontFamily(previewFontFamily);
  }

  /**
   * 加载到 UI
   */
  async loadToUI() {
    const modalElement = this.modal.getModal();
    if (!modalElement) return;

    const editorFontInput = modalElement.querySelector(SELECTORS.EDITOR_FONT_INPUT);
    const editorFontFamilySelect = modalElement.querySelector(SELECTORS.EDITOR_FONT_FAMILY_SELECT);
    const previewFontInput = modalElement.querySelector(SELECTORS.PREVIEW_FONT_INPUT);
    const previewFontFamilySelect = modalElement.querySelector(SELECTORS.PREVIEW_FONT_FAMILY_SELECT);

    // 加载字体大小
    const editorFontSize = await this.prefsService.get('editorFontSize', DEFAULTS.EDITOR_FONT_SIZE);
    const previewFontSize = await this.prefsService.get('previewFontSize', DEFAULTS.PREVIEW_FONT_SIZE);
    
    if (editorFontInput) editorFontInput.value = editorFontSize;
    if (previewFontInput) previewFontInput.value = previewFontSize;

    // 加载字体系列
    const editorFontFamily = await this.prefsService.get('editorFontFamily', DEFAULTS.EDITOR_FONT_FAMILY);
    const previewFontFamily = await this.prefsService.get('previewFontFamily', DEFAULTS.PREVIEW_FONT_FAMILY);
    
    if (editorFontFamilySelect) editorFontFamilySelect.value = editorFontFamily;
    if (previewFontFamilySelect) previewFontFamilySelect.value = previewFontFamily;
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 防止重复绑定
    if (this.eventsBound) return;
    
    const modalElement = this.modal.getModal();
    if (!modalElement) return;

    // 编辑器字体大小
    const editorFontInput = modalElement.querySelector(SELECTORS.EDITOR_FONT_INPUT);
    if (editorFontInput) {
      editorFontInput.addEventListener('input', () => {
        this.handleEditorFontSizeChange(editorFontInput.value);
      });
    }

    // 编辑器字体系列
    const editorFontFamilySelect = modalElement.querySelector(SELECTORS.EDITOR_FONT_FAMILY_SELECT);
    if (editorFontFamilySelect) {
      editorFontFamilySelect.addEventListener('change', () => {
        this.handleEditorFontFamilyChange(editorFontFamilySelect.value);
      });
    }

    // 预览区字体大小
    const previewFontInput = modalElement.querySelector(SELECTORS.PREVIEW_FONT_INPUT);
    if (previewFontInput) {
      previewFontInput.addEventListener('input', () => {
        this.handlePreviewFontSizeChange(previewFontInput.value);
      });
    }

    // 预览区字体系列
    const previewFontFamilySelect = modalElement.querySelector(SELECTORS.PREVIEW_FONT_FAMILY_SELECT);
    if (previewFontFamilySelect) {
      previewFontFamilySelect.addEventListener('change', () => {
        this.handlePreviewFontFamilyChange(previewFontFamilySelect.value);
      });
    }
    
    this.eventsBound = true;
  }

  /**
   * 处理编辑器字体大小变化
   */
  async handleEditorFontSizeChange(size) {
    const fontSize = this.validateFontSize(size);
    if (fontSize !== null) {
      await this.applyEditorFontSize(fontSize);
    }
  }

  /**
   * 处理编辑器字体系列变化
   */
  async handleEditorFontFamilyChange(fontFamily) {
    if (fontFamily) {
      await this.applyEditorFontFamily(fontFamily);
    }
  }

  /**
   * 处理预览区字体大小变化
   */
  async handlePreviewFontSizeChange(size) {
    const fontSize = this.validateFontSize(size);
    if (fontSize !== null) {
      await this.applyPreviewFontSize(fontSize);
    }
  }

  /**
   * 处理预览区字体系列变化
   */
  async handlePreviewFontFamilyChange(fontFamily) {
    if (fontFamily) {
      await this.applyPreviewFontFamily(fontFamily);
    }
  }

  /**
   * 应用编辑器字体大小
   */
  async applyEditorFontSize(size) {
    const fontSize = this.validateFontSize(size);
    if (fontSize === null) return;

    document.documentElement.style.setProperty(CSS_VARS.EDITOR_FONT_SIZE, `${fontSize}px`);
    await this.prefsService.set('editorFontSize', fontSize);
  }

  /**
   * 应用编辑器字体系列
   */
  async applyEditorFontFamily(fontFamily) {
    if (!fontFamily) return;

    document.documentElement.style.setProperty(CSS_VARS.EDITOR_FONT_FAMILY, fontFamily);
    await this.prefsService.set('editorFontFamily', fontFamily);
  }

  /**
   * 应用预览区字体大小
   */
  async applyPreviewFontSize(size) {
    const fontSize = this.validateFontSize(size);
    if (fontSize === null) return;

    document.documentElement.style.setProperty(CSS_VARS.PREVIEW_FONT_SIZE, `${fontSize}px`);
    await this.prefsService.set('previewFontSize', fontSize);
  }

  /**
   * 应用预览区字体系列
   */
  async applyPreviewFontFamily(fontFamily) {
    if (!fontFamily) return;

    document.documentElement.style.setProperty(CSS_VARS.PREVIEW_FONT_FAMILY, fontFamily);
    await this.prefsService.set('previewFontFamily', fontFamily);
  }

  /**
   * 验证字体大小
   */
  validateFontSize(size) {
    const fontSize = parseInt(size, 10);
    if (isNaN(fontSize)) return null;
    
    // 限制在范围内
    return Math.min(Math.max(fontSize, FONT_SIZE.MIN), FONT_SIZE.MAX);
  }

  /**
   * 重置到默认值
   */
  async reset() {
    await this.applyEditorFontSize(DEFAULTS.EDITOR_FONT_SIZE);
    await this.applyEditorFontFamily(DEFAULTS.EDITOR_FONT_FAMILY);
    await this.applyPreviewFontSize(DEFAULTS.PREVIEW_FONT_SIZE);
    await this.applyPreviewFontFamily(DEFAULTS.PREVIEW_FONT_FAMILY);
    
    // 更新 UI
    await this.loadToUI();
  }
}
