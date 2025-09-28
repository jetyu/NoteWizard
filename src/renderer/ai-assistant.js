export class AIAssistant {
  constructor() {
    this.isEnabled = false;
    this.isProcessing = false;
    this.lastInputTime = 0;
    this.typingTimer = null;
    this.suggestionElement = null;
    this.currentSuggestion = '';
    this.cursorPosition = { line: 0, ch: 0 };
    this.typingDelay = 2000; // 2秒后触发AI辅助写作
    this.minInputLength = 10; // 最小输入长度才触发AI辅助
    this.init();
  }

  init() {
    this.loadSettings();
    this.createSuggestionUI();
    this.bindEvents();
    this.startAutoSave();
  }

  // 加载设置
  loadSettings() {
    try {
      const aiSettings = JSON.parse(localStorage.getItem('aiSettings') || '{}');
      this.isEnabled = aiSettings.enabled !== false; // 默认启用
      this.typingDelay = aiSettings.typingDelay || 2000;
      this.minInputLength = aiSettings.minInputLength || 10;
    } catch (error) {
      console.error('加载AI设置失败:', error);
      this.isEnabled = true; // 默认启用
    }
  }

  // 创建建议UI
  createSuggestionUI() {
    if (this.suggestionElement) return;

    this.suggestionElement = document.createElement('div');
    this.suggestionElement.className = 'ai-suggestion';
    this.suggestionElement.style.cssText = `
      position: absolute;
      background: rgba(100, 150, 255, 0.1);
      border: 1px solid rgba(100, 150, 255, 0.3);
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 14px;
      color: #666;
      pointer-events: none;
      z-index: 1000;
      display: none;
      max-width: 300px;
      word-wrap: break-word;
      white-space: pre-wrap;
    `;

    document.body.appendChild(this.suggestionElement);
  }

  // 绑定事件
  bindEvents() {
    // 监听编辑器内容变化
    window.addEventListener('editor-content-changed', this.handleContentChange.bind(this));

    // 监听光标位置变化
    window.addEventListener('editor-cursor-changed', this.handleCursorChange.bind(this));

    // 监听设置变化
    window.addEventListener('ai-settings-changed', this.handleSettingsChange.bind(this));

    // 监听窗口大小变化
    window.addEventListener('resize', this.hideSuggestion.bind(this));
  }

  // 处理内容变化
  handleContentChange(event) {
    if (!this.isEnabled || this.isProcessing) return;

    const { content } = event.detail || {};
    if (!content || content.length < this.minInputLength) {
      this.hideSuggestion();
      return;
    }

    // 重置定时器
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    this.typingTimer = setTimeout(() => {
      this.generateSuggestion(content);
    }, this.typingDelay);
  }

  // 处理光标变化
  handleCursorChange(event) {
    const { cursor } = event.detail || {};
    if (cursor) {
      this.cursorPosition = cursor;
      this.updateSuggestionPosition();
    }
  }

  // 处理设置变化
  handleSettingsChange(event) {
    const { settings } = event.detail || {};
    if (settings) {
      this.isEnabled = settings.enabled !== false;
      this.typingDelay = settings.typingDelay || 2000;
      this.minInputLength = settings.minInputLength || 10;
    }
  }

  // 生成建议
  async generateSuggestion(content) {
    if (!this.isEnabled || this.isProcessing) return;

    this.isProcessing = true;

    try {
      const aiSettings = JSON.parse(localStorage.getItem('aiSettings') || '{}');

      if (!aiSettings.apiKey || !aiSettings.provider) {
        console.log('AI配置不完整，跳过辅助写作');
        return;
      }

      // 获取当前光标位置前的文本作为上下文
      const context = this.getContextText(content);
      if (context.length < this.minInputLength) {
        return;
      }

      const suggestion = await this.callAIAPI(context, aiSettings);

      if (suggestion && suggestion.trim()) {
        this.showSuggestion(suggestion);
      }
    } catch (error) {
      console.error('生成AI建议失败:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // 获取上下文文本
  getContextText(content) {
    const lines = content.split('\n');
    const currentLineIndex = this.cursorPosition.line;
    const currentCol = this.cursorPosition.ch;

    // 获取当前行之前的文本
    const currentLine = lines[currentLineIndex] || '';
    const contextBeforeCursor = currentLine.substring(0, currentCol);

    // 如果当前行有足够的内容，直接使用当前行
    if (contextBeforeCursor.length >= this.minInputLength) {
      return contextBeforeCursor;
    }

    // 否则获取前几行的内容
    let context = '';
    let startLine = Math.max(0, currentLineIndex - 3);

    for (let i = startLine; i <= currentLineIndex; i++) {
      if (i === currentLineIndex) {
        context += lines[i].substring(0, currentCol);
      } else {
        context += lines[i] + '\n';
      }
    }

    return context;
  }

  // 调用AI API
  async callAIAPI(context, settings) {
    const endpoint = settings.endpoint;
    const model = settings.model;

    const requestBody = {
      model: model,
      messages: [
        {
          role: 'system',
          content: '你是一个AI写作助手，请根据用户提供的上下文，续写或完善文本。只需要返回续写的部分，不要重复用户的文本。'
        },
        {
          role: 'user',
          content: `请根据以下上下文续写：\n\n${context}`
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
      stream: false
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`API错误: ${data.error.message}`);
      }

      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('AI API调用失败:', error);
      throw error;
    }
  }

  // 显示建议
  showSuggestion(suggestion) {
    if (!suggestion || !suggestion.trim()) return;

    this.currentSuggestion = suggestion.trim();
    this.updateSuggestionPosition();
    this.suggestionElement.textContent = this.currentSuggestion;
    this.suggestionElement.style.display = 'block';
  }

  // 隐藏建议
  hideSuggestion() {
    if (this.suggestionElement) {
      this.suggestionElement.style.display = 'none';
    }
    this.currentSuggestion = '';
  }

  // 更新建议位置
  updateSuggestionPosition() {
    if (!this.currentSuggestion || !this.suggestionElement) return;

    const editorElement = document.querySelector('.CodeMirror');
    if (!editorElement) return;

    const cursorCoords = editorElement.CodeMirror.cursorCoords(this.cursorPosition, 'local');
    const editorRect = editorElement.getBoundingClientRect();

    this.suggestionElement.style.left = `${cursorCoords.left + editorRect.left}px`;
    this.suggestionElement.style.top = `${cursorCoords.bottom + editorRect.top + 5}px`;
  }

  // 应用建议
  applySuggestion() {
    if (!this.currentSuggestion) return;

    // 触发自定义事件，让编辑器处理建议的插入
    const event = new CustomEvent('apply-ai-suggestion', {
      detail: { suggestion: this.currentSuggestion }
    });
    window.dispatchEvent(event);

    this.hideSuggestion();
  }

  // 自动保存设置
  startAutoSave() {
    // 定期检查设置变化
    setInterval(() => {
      this.loadSettings();
    }, 5000);
  }

  // 销毁
  destroy() {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    if (this.suggestionElement) {
      this.suggestionElement.remove();
    }

    // 移除事件监听器
    window.removeEventListener('editor-content-changed', this.handleContentChange.bind(this));
    window.removeEventListener('editor-cursor-changed', this.handleCursorChange.bind(this));
    window.removeEventListener('ai-settings-changed', this.handleSettingsChange.bind(this));
    window.removeEventListener('resize', this.hideSuggestion.bind(this));
  }
}

// 导出单例实例
let aiAssistantInstance = null;

export function getAIAssistant() {
  if (!aiAssistantInstance) {
    aiAssistantInstance = new AIAssistant();
  }
  return aiAssistantInstance;
}
