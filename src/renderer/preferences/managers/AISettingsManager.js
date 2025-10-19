/**
 * AI 设置管理器
 * 负责 AI 助手的所有设置
 */
import { SELECTORS, DEFAULTS, EVENTS } from '../constants.js';

export class AISettingsManager {
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
    await this.loadAISettings();
  }

  /**
   * 加载 AI 设置
   */
  async loadAISettings() {
    const modalElement = this.modal.getModal();
    if (!modalElement) return;

    const modelInput = modalElement.querySelector(SELECTORS.AI_MODEL_INPUT);
    const apiKeyInput = modalElement.querySelector(SELECTORS.AI_API_KEY_INPUT);
    const endpointInput = modalElement.querySelector(SELECTORS.AI_ENDPOINT_INPUT);
    const aiEnabledInput = modalElement.querySelector(SELECTORS.AI_ENABLED_INPUT);
    const aiTypingDelayInput = modalElement.querySelector(SELECTORS.AI_TYPING_DELAY_INPUT);
    const aiTypingLengthInput = modalElement.querySelector(SELECTORS.AI_TYPING_LENGTH_INPUT);
    const systemPromptInput = modalElement.querySelector(SELECTORS.AI_SYSTEM_PROMPT_INPUT);

    if (!modelInput || !apiKeyInput || !endpointInput) {
      return;
    }

    // 从 preferences 读取 AI 设置
    const settings = await this.prefsService.get('aiSettings', {});

    // 加载模型、API密钥和端点
    if (settings.model) modelInput.value = settings.model;
    if (settings.apiKey) apiKeyInput.value = settings.apiKey;
    if (settings.endpoint) endpointInput.value = settings.endpoint;

    // 加载AI辅助启用状态
    if (aiEnabledInput) {
      aiEnabledInput.checked = settings.enabled === true;
    }

    // 加载输入延迟和最小输入长度
    if (aiTypingDelayInput) {
      aiTypingDelayInput.value = settings.typingDelay || DEFAULTS.AI_SETTINGS.typingDelay;
    }

    if (aiTypingLengthInput) {
      aiTypingLengthInput.value = settings.minInputLength || DEFAULTS.AI_SETTINGS.minInputLength;
    }

    // 加载系统提示词
    if (systemPromptInput) {
      systemPromptInput.value = settings.systemPrompt || DEFAULTS.AI_SETTINGS.systemPrompt;
    }

    // 更新相关字段的可用性状态
    this.updateAIFieldsState();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    const modalElement = this.modal.getModal();
    if (!modalElement) return;

    // AI 开关
    this.bindAIEnabledEvents(modalElement);
    
    // AI 配置字段
    this.bindAIConfigEvents(modalElement);
    
    // 测试连接按钮
    this.bindTestConnectionEvents(modalElement);
  }

  /**
   * 绑定 AI 开关事件
   */
  bindAIEnabledEvents(modalElement) {
    const aiEnabledInput = modalElement.querySelector(SELECTORS.AI_ENABLED_INPUT);
    if (!aiEnabledInput) return;

    aiEnabledInput.addEventListener('change', () => {
      this.saveAISettings();
      this.updateAIFieldsState();
    });
  }

  /**
   * 绑定 AI 配置字段事件
   */
  bindAIConfigEvents(modalElement) {
    const aiTypingDelayInput = modalElement.querySelector(SELECTORS.AI_TYPING_DELAY_INPUT);
    const aiTypingLengthInput = modalElement.querySelector(SELECTORS.AI_TYPING_LENGTH_INPUT);
    const modelInput = modalElement.querySelector(SELECTORS.AI_MODEL_INPUT);
    const apiKeyInput = modalElement.querySelector(SELECTORS.AI_API_KEY_INPUT);
    const endpointInput = modalElement.querySelector(SELECTORS.AI_ENDPOINT_INPUT);
    const systemPromptInput = modalElement.querySelector(SELECTORS.AI_SYSTEM_PROMPT_INPUT);

    // 为输入延迟和最小输入长度添加事件监听
    if (aiTypingDelayInput) {
      aiTypingDelayInput.addEventListener('change', () => this.saveAISettings());
      aiTypingDelayInput.addEventListener('blur', () => this.saveAISettings());
    }

    if (aiTypingLengthInput) {
      aiTypingLengthInput.addEventListener('change', () => this.saveAISettings());
      aiTypingLengthInput.addEventListener('blur', () => this.saveAISettings());
    }

    // 为其他字段添加事件监听
    const aiFields = [modelInput, apiKeyInput, endpointInput, systemPromptInput];
    aiFields.forEach(field => {
      if (field) {
        field.addEventListener('change', () => this.saveAISettings());
        field.addEventListener('blur', () => this.saveAISettings());
      }
    });
  }

  /**
   * 绑定测试连接事件
   */
  bindTestConnectionEvents(modalElement) {
    const testButton = modalElement.querySelector(SELECTORS.AI_TEST_BTN);
    if (!testButton) return;

    testButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const testStatus = modalElement.querySelector(SELECTORS.AI_TEST_STATUS);
      
      if (testStatus) {
        testStatus.textContent = this.t('testConnectionTesting');
        testStatus.className = 'test-status testing';
      }
      
      try {
        await this.testAIConnection();
      } catch (error) {
        if (testStatus) {
          testStatus.textContent = this.t('testConnectionFailed') + (error.message || error);
          testStatus.className = 'test-status error';
        }
      }
    });
  }

  /**
   * 保存 AI 设置
   */
  async saveAISettings() {
    const modalElement = this.modal.getModal();
    if (!modalElement) return;

    const aiEnabledInput = modalElement.querySelector(SELECTORS.AI_ENABLED_INPUT);
    const aiTypingDelayInput = modalElement.querySelector(SELECTORS.AI_TYPING_DELAY_INPUT);
    const aiTypingLengthInput = modalElement.querySelector(SELECTORS.AI_TYPING_LENGTH_INPUT);
    const modelInput = modalElement.querySelector(SELECTORS.AI_MODEL_INPUT);
    const apiKeyInput = modalElement.querySelector(SELECTORS.AI_API_KEY_INPUT);
    const endpointInput = modalElement.querySelector(SELECTORS.AI_ENDPOINT_INPUT);
    const systemPromptInput = modalElement.querySelector(SELECTORS.AI_SYSTEM_PROMPT_INPUT);

    if (!modelInput || !apiKeyInput || !endpointInput || !aiEnabledInput || 
        !aiTypingDelayInput || !aiTypingLengthInput) {
      console.error('[AISettingsManager] Required AI settings elements not found');
      return;
    }

    const settings = {
      model: modelInput.value.trim(),
      apiKey: apiKeyInput.value.trim(),
      endpoint: endpointInput.value.trim(),
      enabled: aiEnabledInput.checked,
      typingDelay: parseInt(aiTypingDelayInput.value) || DEFAULTS.AI_SETTINGS.typingDelay,
      minInputLength: parseInt(aiTypingLengthInput.value) || DEFAULTS.AI_SETTINGS.minInputLength,
      systemPrompt: systemPromptInput ? systemPromptInput.value.trim() : DEFAULTS.AI_SETTINGS.systemPrompt
    };

    // 保存到 preferences
    await this.prefsService.set('aiSettings', settings);

    // 触发设置变更事件，通知AI助手
    const event = new CustomEvent(EVENTS.AI_SETTINGS_CHANGED, {
      detail: { settings }
    });
    window.dispatchEvent(event);
  }

  /**
   * 测试 AI 连接
   */
  async testAIConnection() {
    const modalElement = this.modal.getModal();
    if (!modalElement) return;

    const modelInput = modalElement.querySelector(SELECTORS.AI_MODEL_INPUT);
    const apiKeyInput = modalElement.querySelector(SELECTORS.AI_API_KEY_INPUT);
    const endpointInput = modalElement.querySelector(SELECTORS.AI_ENDPOINT_INPUT);
    const testStatus = modalElement.querySelector(SELECTORS.AI_TEST_STATUS);

    if (!modelInput || !apiKeyInput || !endpointInput || !testStatus) {
      return;
    }

    const settings = {
      model: modelInput.value.trim(),
      apiKey: apiKeyInput.value.trim(),
      endpoint: endpointInput.value.trim()
    };

    // 验证必填字段
    if (!settings.model || !settings.apiKey || !settings.endpoint) {
      testStatus.textContent = this.t('InputAllFields');
      testStatus.className = 'test-status error';
      return;
    }

    testStatus.textContent = this.t('testConnectionTesting');
    testStatus.className = 'test-status testing';

    try {
      const response = await fetch(settings.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `请求失败: ${response.status} ${response.statusText}`);
      }

      if (!data.choices || !Array.isArray(data.choices)) {
        throw new Error(this.t('apiFormatInvalid'));
      }

      testStatus.textContent = this.t('testConnectionSuccess');
      testStatus.className = 'test-status success';

    } catch (error) {
      testStatus.textContent = this.t('testConnectionFailed') + ': ' + error.message;
      testStatus.className = 'test-status error';
      throw error;
    }
  }

  /**
   * 更新 AI 相关字段的可用性状态
   */
  updateAIFieldsState() {
    const modalElement = this.modal.getModal();
    if (!modalElement) return;

    const aiEnabledInput = modalElement.querySelector(SELECTORS.AI_ENABLED_INPUT);
    if (!aiEnabledInput) return;

    const isEnabled = aiEnabledInput.checked;

    // 需要更新状态的元素
    const elementsToUpdate = [
      SELECTORS.AI_TYPING_DELAY_INPUT,
      SELECTORS.AI_TYPING_LENGTH_INPUT,
      SELECTORS.AI_MODEL_INPUT,
      SELECTORS.AI_API_KEY_INPUT,
      SELECTORS.AI_ENDPOINT_INPUT,
      SELECTORS.AI_SYSTEM_PROMPT_INPUT,
      SELECTORS.AI_TEST_BTN
    ];

    // 只更新元素的 disabled 属性
    elementsToUpdate.forEach(selector => {
      const element = modalElement.querySelector(selector);
      if (element) {
        element.disabled = !isEnabled;
      }
    });
  }

  /**
   * 翻译辅助函数
   */
  t(key) {
    return this.i18n?.t ? this.i18n.t(key) : key;
  }

  /**
   * 重置到默认值
   */
  async reset() {
    await this.prefsService.set('aiSettings', DEFAULTS.AI_SETTINGS);
    
    // 重新加载到 UI
    await this.loadAISettings();
    
    // 触发设置变更事件
    const event = new CustomEvent(EVENTS.AI_SETTINGS_CHANGED, {
      detail: { settings: DEFAULTS.AI_SETTINGS }
    });
    window.dispatchEvent(event);
  }
}
