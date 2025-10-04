import i18n from './i18n.js';
import { applyThemeByMode } from './theme.js';
import * as vfs from './workspace/vfs.js';

const electronAPI = window.electronAPI;

if (!electronAPI) {
  throw new Error('electronAPI 未初始化，无法在渲染进程访问受信任的 Node API');
}

const {
  ipcRenderer,
  path: electronPath,
  fs: electronFs,
} = electronAPI;

function resolveFilePath(relativePath) {
  const fileUrl = new URL(relativePath, import.meta.url);
  let pathname = decodeURIComponent(fileUrl.pathname);
  if (/^\/[A-Za-z]:/.test(pathname)) pathname = pathname.slice(1);
  return electronPath.normalize(pathname);
}

// 获取默认的笔记保存路径
async function getDefaultSavePath() {
  try {
    return await ipcRenderer.invoke('get-default-save-path');
  } catch (error) {
    return '';
  }
}

async function loadNoteSavePath() {
  const pathInput = document.getElementById('pref-note-save-path');
  if (!pathInput) return;

  try {
    // 从 preferences.json 读取保存的路径
    let savedPath = await ipcRenderer.invoke('preferences:get', 'noteSavePath', null);

    // 如果没有保存的路径，使用默认路径
    if (!savedPath) {
      savedPath = await getDefaultSavePath();
      await ipcRenderer.invoke('preferences:set', 'noteSavePath', savedPath);
    }

    pathInput.value = savedPath;
  } catch (error) {
    console.error('Failed to load noteSavePath:', error);
  }
}

// 保存笔记路径
async function saveNoteSavePath(path, showConfirmation = true) {
  if (!path) return;

  // 保存当前路径，以便在取消时恢复
  const currentPath = await ipcRenderer.invoke('preferences:get', 'noteSavePath', null);
  if (currentPath) {
    // 使用 localStorage 保存临时回退路径（不重要）
    localStorage.setItem('previousNoteSavePath', currentPath);
  }

  const pathInput = document.getElementById('pref-note-save-path');
  if (pathInput) {
    pathInput.value = path;
  }

  // 保存到 preferences.json
  await ipcRenderer.invoke('preferences:set', 'noteSavePath', path);

  try {
    // 通过主进程确保目录存在
    const result = await ipcRenderer.invoke('ensure-directory-exists', path);
    if (!result.success) {
      throw new Error(result.error || '创建目录失败');
    }

    // 重新初始化工作区
    const { root } = vfs.initWorkspace(path);

    // 更新状态
    const statusElement = document.getElementById('status');
    if (statusElement) {
      statusElement.textContent = `${i18n.t('noteSavePathUpdated')}: ${root}`;
    }

    // 发送事件通知其他组件路径已更新
    const event = new CustomEvent('noteSavePathChanged', { detail: { path: root } });
    document.dispatchEvent(event);

    let confirmed = true;
    if (showConfirmation) {
      confirmed = confirm(i18n.t('noteSavePathUpdateConfirm'));
    }

    if (confirmed) {
      try {
        await ipcRenderer.invoke('relaunch-app');
      } catch (err) {
        // 如果重启失败，回退到之前的路径
        const previousPath = localStorage.getItem('previousNoteSavePath') || await getDefaultSavePath();
        await ipcRenderer.invoke('preferences:set', 'noteSavePath', previousPath);
        const statusElement = document.getElementById('status');
        if (statusElement) {
          statusElement.textContent = `${i18n.t('cancelledKeepPath')}: ${previousPath}`;
        }
      }
    } else {
      // 用户取消重启，回退到之前的路径
      const previousPath = localStorage.getItem('previousNoteSavePath') || await getDefaultSavePath();
      await ipcRenderer.invoke('preferences:set', 'noteSavePath', previousPath);

      // 更新输入框显示
      const pathInput = document.getElementById('pref-note-save-path');
      if (pathInput) {
        pathInput.value = previousPath;
      }

      // 更新状态
      const statusElement = document.getElementById('status');
      if (statusElement) {
        statusElement.textContent = `${i18n.t('cancelledKeepPath')}: ${previousPath}`;
      }

      // 通知其他组件路径已恢复
      const event = new CustomEvent('noteSavePathChanged', { detail: { path: previousPath } });
      document.dispatchEvent(event);
    }
  } catch (error) {
    // 恢复之前的路径
    const previousPath = localStorage.getItem('previousNoteSavePath');
    if (previousPath) {
      await ipcRenderer.invoke('preferences:set', 'noteSavePath', previousPath);
      const pathInput = document.getElementById('pref-note-save-path');
      if (pathInput) {
        pathInput.value = previousPath;
      }
    }

    const statusElement = document.getElementById('status');
    if (statusElement) {
      statusElement.textContent = i18n.t('savePathFailed');
    }
  }
}

// 打开目录选择对话框
async function selectNoteSaveDirectory() {
  try {
    const currentPath = document.getElementById('pref-note-save-path')?.value || await getDefaultSavePath();
    const result = await ipcRenderer.invoke('select-directory', currentPath);

    if (result) {
      await saveNoteSavePath(result);
    }

    return result;
  } catch (error) {
    return null;
  }
}


// 更新AI相关字段的可用性状态
function updateAIFieldsState() {
  const aiEnabledInput = document.getElementById('pref-ai-enabled');
  if (!aiEnabledInput) return;
  
  const isEnabled = aiEnabledInput.checked;
  
  // 需要更新状态的元素
  const elementsToUpdate = [
    'pref-ai-typing-delay',
    'pref-ai-typing-length',
    'pref-ai-model',
    'pref-ai-api-key',
    'pref-ai-endpoint',
    'pref-ai-system-prompt',
    'pref-ai-test'
  ];
  
  // 只更新元素的disabled属性
  elementsToUpdate.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.disabled = !isEnabled;
    }
  });
}

async function loadAISettings() {
  const modelInput = document.getElementById('pref-ai-model');
  const apiKeyInput = document.getElementById('pref-ai-api-key');
  const endpointInput = document.getElementById('pref-ai-endpoint');
  const aiEnabledInput = document.getElementById('pref-ai-enabled');
  const aiTypingDelayInput = document.getElementById('pref-ai-typing-delay');
  const aiTypingLengthInput = document.getElementById('pref-ai-typing-length');
  const systemPromptInput = document.getElementById('pref-ai-system-prompt');

  if (!modelInput || !apiKeyInput || !endpointInput) {
    return;
  }

  // 从 preferences.json 读取 AI 设置
  const settings = await ipcRenderer.invoke('preferences:get', 'aiSettings', {});
    
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
    aiTypingDelayInput.value = settings.typingDelay || 2000;
  }
  
  if (aiTypingLengthInput) {
    aiTypingLengthInput.value = settings.minInputLength || 10;
  }
  
  // 加载系统提示词
  if (systemPromptInput) {
    systemPromptInput.value = settings.systemPrompt || '';
  }
  
  // 更新相关字段的可用性状态
  updateAIFieldsState();
}
async function testAIConnection() {
  const modelInput = document.getElementById('pref-ai-model');
  const apiKeyInput = document.getElementById('pref-ai-api-key');
  const endpointInput = document.getElementById('pref-ai-endpoint');
  const testStatus = document.getElementById('pref-ai-test-status');

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
    testStatus.textContent = i18n.t('InputAllFields')
    testStatus.className = 'test-status error';
    return;
  }
  testStatus.textContent = i18n.t('testConnectionTesting');
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
        messages: [{role: 'user', content: 'Hello'}],
        max_tokens: 5
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || `请求失败: ${response.status} ${response.statusText}`);
    }
    
    if (!data.choices || !Array.isArray(data.choices)) {
      throw new Error(i18n.t('apiFormatInvalid'));
    }
    
    testStatus.textContent = i18n.t('testConnectionSuccess');
    testStatus.className = 'test-status success';
    
  } catch (error) {
    testStatus.textContent = i18n.t('testConnectionFailed'), error.message;
    testStatus.className = 'test-status error';
  }
}
// 保存AI设置
async function saveAISettings() {
  const aiEnabledInput = document.getElementById('pref-ai-enabled');
  const aiTypingDelayInput = document.getElementById('pref-ai-typing-delay');
  const aiTypingLengthInput = document.getElementById('pref-ai-typing-length');
  const modelInput = document.getElementById('pref-ai-model');
  const apiKeyInput = document.getElementById('pref-ai-api-key');
  const endpointInput = document.getElementById('pref-ai-endpoint');
  const systemPromptInput = document.getElementById('pref-ai-system-prompt');

  if (!modelInput || !apiKeyInput || !endpointInput || !aiEnabledInput || !aiTypingDelayInput || !aiTypingLengthInput) {
    console.error('无法找到AI设置相关的DOM元素');
    return;
  }

  const settings = {
    model: modelInput.value.trim(),
    apiKey: apiKeyInput.value.trim(),
    endpoint: endpointInput.value.trim(),
    enabled: aiEnabledInput.checked,
    typingDelay: parseInt(aiTypingDelayInput.value) || 2000,
    minInputLength: parseInt(aiTypingLengthInput.value) || 10,
    systemPrompt: systemPromptInput ? systemPromptInput.value.trim() : '你是一个AI写作助手，请根据用户提供的上下文，续写或完善文本。只需要返回续写的部分，不要重复用户的文本。每次最多返回一句话。'
  };

  // 保存到 preferences.json
  await ipcRenderer.invoke('preferences:set', 'aiSettings', settings);
  
  // 触发设置变更事件，通知AI助手
  const event = new CustomEvent('ai-settings-changed', {
    detail: { settings }
  });
  window.dispatchEvent(event);
}

// 应用编辑器字体大小
async function applyEditorFont(size) {
  const fontSize = Math.min(Math.max(parseInt(size, 10), 10), 24); // 限制在10-24px之间
  if (isNaN(fontSize)) return;
  document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);
  await ipcRenderer.invoke('preferences:set', 'editorFontSize', fontSize);
}

// 应用预览区字体大小
async function applyPreviewFont(size) {
  const fontSize = Math.min(Math.max(parseInt(size, 10), 10), 24); // 限制在10-24px之间
  if (isNaN(fontSize)) return;
  document.documentElement.style.setProperty('--preview-font-size', `${fontSize}px`);
  await ipcRenderer.invoke('preferences:set', 'previewFontSize', fontSize);
}

// 应用编辑器字体
async function applyEditorFontFamily(font) {
  if (!font) return;
  document.documentElement.style.setProperty('--editor-font-family', font);
  await ipcRenderer.invoke('preferences:set', 'editorFontFamily', font);
}

// 应用预览区字体
async function applyPreviewFontFamily(font) {
  if (!font) return;
  document.documentElement.style.setProperty('--preview-font-family', font);
  await ipcRenderer.invoke('preferences:set', 'previewFontFamily', font);
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
}


function getSystemPrefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

let systemListenerSetup = false;
async function setupSystemWatcher() {
  if (systemListenerSetup) return;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = async () => {
    const mode = await ipcRenderer.invoke('preferences:get', 'themeMode', 'light');
    if (mode === 'system') {
      const effective = getSystemPrefersDark() ? 'dark' : 'light';
      applyTheme(effective);
    }
  };
  if (mq.addEventListener) mq.addEventListener('change', handler);
  else if (mq.addListener) mq.addListener(handler);
  systemListenerSetup = true;
}

async function ensureModalExists() {
  if (document.getElementById('preferences-modal')) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'preferences-modal';
  wrapper.className = 'modal hidden';
  wrapper.setAttribute('role', 'dialog');
  wrapper.setAttribute('aria-modal', 'true');
  wrapper.setAttribute('aria-labelledby', 'pref-title');

  try {
    // 使用 require 导入模板内容
    // 获取模板文件的绝对路径
    const templatePath = resolveFilePath('../templates/preferences.html');
    const htmlContent = electronFs.readFileSync(templatePath, 'utf8');

    wrapper.innerHTML = htmlContent;
    document.body.appendChild(wrapper);

    // 应用国际化
    if (i18n && typeof i18n.applyI18n === 'function') {
      try {
        i18n.applyI18n();
      } catch (error) {
      }
    }

    // 绑定关闭按钮事件
    const closeBtn = wrapper.querySelector('#pref-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    // 绑定其他事件
    bindEvents();
  } catch (error) {
  }
}

async function openModal() {
  await ensureModalExists();
  const modal = document.getElementById('preferences-modal');
  const sidebarItems = modal.querySelectorAll('.pref-sidebar li');
  const panes = modal.querySelectorAll('.pref-pane');
  sidebarItems.forEach((li) => li.classList.remove('active'));
  panes.forEach((p) => p.classList.remove('active'));
  const savedKey = localStorage.getItem('prefActivePane') || 'general';
  const liToActivate = modal.querySelector(`.pref-sidebar li[data-pane="${savedKey}"]`) || modal.querySelector('.pref-sidebar li[data-pane="general"]');
  const paneToActivate = modal.querySelector(`#pane-${savedKey}`) || modal.querySelector('#pane-general');
  if (liToActivate) liToActivate.classList.add('active');
  if (paneToActivate) paneToActivate.classList.add('active');
  const select = document.getElementById('pref-theme-mode');
  const editorFontInput = document.getElementById('pref-editor-font');
  const editorFontFamilySelect = document.getElementById('pref-editor-font-family');
  const previewFontInput = document.getElementById('pref-preview-font');
  const previewFontFamilySelect = document.getElementById('pref-preview-font-family');
  const langSelect = document.getElementById('pref-lang');
  if (!modal || !select) return;

  // 从 preferences.json 读取主题设置
  const mode = await ipcRenderer.invoke('preferences:get', 'themeMode', null);
  if (mode) {
    select.value = mode;
  } else {
    select.value = 'light';
  }

  // 从 preferences.json 读取字体大小
  const ef = await ipcRenderer.invoke('preferences:get', 'editorFontSize', 14);
  const pf = await ipcRenderer.invoke('preferences:get', 'previewFontSize', 14);
  if (editorFontInput) editorFontInput.value = ef;
  if (previewFontInput) previewFontInput.value = pf;

  // 从 preferences.json 读取字体设置
  const editorFont = await ipcRenderer.invoke('preferences:get', 'editorFontFamily', "'Microsoft YaHei', '微软雅黑', sans-serif");
  const previewFont = await ipcRenderer.invoke('preferences:get', 'previewFontFamily', "'Microsoft YaHei', '微软雅黑', sans-serif");
  if (editorFontFamilySelect) editorFontFamilySelect.value = editorFont;
  if (previewFontFamilySelect) previewFontFamilySelect.value = previewFont;


  if (i18n && typeof i18n.applyI18n === 'function') {
    try { i18n.applyI18n(); } catch { }
  }
  modal.classList.remove('hidden');
}

function closeModal() {
  const modal = document.getElementById('preferences-modal');
  if (modal) modal.classList.add('hidden');
}

function bindEvents() {
  // 确保事件监听器只被添加一次
  if (document.body.hasAttribute('data-events-bound')) {
    return;
  }
  document.body.setAttribute('data-events-bound', 'true');

  ensureModalExists();
  const modal = document.getElementById('preferences-modal');
  const closeBtn = document.getElementById('pref-close');
  const select = document.getElementById('pref-theme-mode');
  const editorFontInput = document.getElementById('pref-editor-font');
  const editorFontFamilySelect = document.getElementById('pref-editor-font-family');
  const previewFontInput = document.getElementById('pref-preview-font');
  const previewFontFamilySelect = document.getElementById('pref-preview-font-family');
  const langSelect = document.getElementById('pref-lang');
  const sidebar = document.querySelector('.pref-sidebar');
  const panes = document.querySelectorAll('.pref-pane');
  const resetBtn = document.getElementById('pref-reset');
  const browseBtn = document.getElementById('browse-note-save-path');
  const exportBtn = document.getElementById('pref-export');
  const importBtn = document.getElementById('pref-import');
  const startupCheckbox = document.getElementById('pref-startup');
  const modelInput = document.getElementById('pref-ai-model');
  const apiKeyInput = document.getElementById('pref-ai-api-key');
  const endpointInput = document.getElementById('pref-ai-endpoint');
  const testButton = document.getElementById('pref-ai-test');

  // 加载已保存的AI设置
  loadAISettings();

  // 绑定测试连接按钮点击事件
if (testButton) {
  testButton.addEventListener('click', async (e) => {
    e.preventDefault();
    const testStatus = document.getElementById('pref-ai-test-status');
    if (testStatus) {
      testStatus.textContent = i18n.t('testConnectionTesting');
      testStatus.className = 'test-status testing';
    }
    try {
      await testAIConnection();
    } catch (error) {
      if (testStatus) {
        testStatus.textContent = i18n.t('testConnectionFailed') + (error.message || error);
        testStatus.className = 'test-status error';
      }
    }
  });
}

  // 绑定AI设置相关事件
  const aiEnabledInput = document.getElementById('pref-ai-enabled');
  const aiTypingDelayInput = document.getElementById('pref-ai-typing-delay');
  const aiTypingLengthInput = document.getElementById('pref-ai-typing-length');
  
  // 为AI开关添加事件监听
  if (aiEnabledInput) {
    aiEnabledInput.addEventListener('change', () => {
      saveAISettings();
      updateAIFieldsState();
    });
  }
  
  // 为输入延迟和最小输入长度添加事件监听
  if (aiTypingDelayInput) {
    aiTypingDelayInput.addEventListener('change', saveAISettings);
    aiTypingDelayInput.addEventListener('blur', saveAISettings);
  }
  
  if (aiTypingLengthInput) {
    aiTypingLengthInput.addEventListener('change', saveAISettings);
    aiTypingLengthInput.addEventListener('blur', saveAISettings);
  }
  
  const systemPromptInput = document.getElementById('pref-ai-system-prompt');
  
  const aiFields = [modelInput, apiKeyInput, endpointInput, systemPromptInput];
  aiFields.forEach(field => {
    if (field) {
      field.addEventListener('change', saveAISettings);
      field.addEventListener('blur', saveAISettings);
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // 初始化并绑定开机自启设置
  if (startupCheckbox && ipcRenderer) {
    // 初始化当前值：优先从主进程查询系统设置
    (async () => {
      try {
        const result = await ipcRenderer.invoke('get-startup-enabled');
        if (result && result.success) {
          startupCheckbox.checked = !!result.enabled;
          try { localStorage.setItem('startupOnLogin', String(!!result.enabled)); } catch {}
        } else {
          const saved = localStorage.getItem('startupOnLogin');
          startupCheckbox.checked = saved === 'true';
        }
      } catch {
        const saved = localStorage.getItem('startupOnLogin');
        startupCheckbox.checked = saved === 'true';
      }
    })();

    // 变更时应用到系统并持久化
    startupCheckbox.addEventListener('change', async () => {
      const desired = !!startupCheckbox.checked;
      startupCheckbox.disabled = true;
      try {
        const res = await ipcRenderer.invoke('set-startup-enabled', desired);
        if (res && res.success) {
          try { localStorage.setItem('startupOnLogin', String(desired)); } catch {}
          const statusElement = document.getElementById('status');
          if (statusElement) {
            statusElement.textContent = desired ? i18n.t('startupEnabled') : i18n.t('startupDisabled');
          }
        } else {
          startupCheckbox.checked = !desired;
          const statusElement = document.getElementById('status');
          if (statusElement) {
            statusElement.textContent = i18n.t('setStartupFailed') + (res?.error ? ': ' + res.error : '');
          }
        }
      } catch (e) {
        startupCheckbox.checked = !desired;
        const statusElement = document.getElementById('status');
        if (statusElement) {
          statusElement.textContent = i18n.t('setStartupFailed') + (e.message || e);
        }
      } finally {
        startupCheckbox.disabled = false;
      }
    });
  }

  if (select) {
    // 设置初始值 (已在 openModal 中从 preferences.json 读取)
    select.addEventListener('change', async () => {
      const val = select.value; 
      await ipcRenderer.invoke('preferences:set', 'themeMode', val);
      applyThemeByMode(val);

      if (val === 'system') {
        await setupSystemWatcher();
      }
    });
  }
  // 字体设置事件监听
  if (editorFontInput) {
    editorFontInput.addEventListener('input', () => applyEditorFont(editorFontInput.value));
  }
  // 字体设置事件监听

  if (editorFontFamilySelect) {
    editorFontFamilySelect.addEventListener('change', () => {
      applyEditorFontFamily(editorFontFamilySelect.value);
    });
  }

  if (previewFontInput) {
    previewFontInput.addEventListener('input', () => applyPreviewFont(previewFontInput.value));
  }

  if (previewFontFamilySelect) {
    previewFontFamilySelect.addEventListener('change', () => {
      applyPreviewFontFamily(previewFontFamilySelect.value);
    });
  }

  if (langSelect && i18n) {
    // 确保i18n已初始化
    i18n.ensureInitialized().then(async () => {
      // 获取支持的语言列表
      const supportedLangs = i18n.getSupportedLanguagesWithNames();

      // 清空现有选项
      langSelect.innerHTML = '';

      // 添加语言选项
      supportedLangs.forEach(({ code, name }) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = name;
        langSelect.appendChild(option);
      });

      // 设置当前选中的语言
      langSelect.value = i18n.currentLanguage;
    }).catch(() => { });

    // 监听语言切换
    langSelect.addEventListener('change', async () => {
      try {
        const selectedLang = langSelect.value;
        await i18n.setLanguage(selectedLang);
        // 更新下拉框显示
        const selectedOption = langSelect.querySelector(`option[value="${selectedLang}"]`);
        if (selectedOption) {
          selectedOption.textContent = i18n.getLanguageDisplayName(selectedLang);
        }
      } catch (error) {
      }
    });
  }

  // 浏览按钮点击事件
  if (browseBtn) {
    browseBtn.addEventListener('click', async () => {
      await selectNoteSaveDirectory();
    });
  }

  // 导出按钮点击事件
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      try {
        // 从 preferences.json 读取所有配置
        const allPrefs = await ipcRenderer.invoke('preferences:getAll');
        
        const aiSettings = allPrefs.aiSettings || {};
        const completeAISettings = {
          enabled: aiSettings.enabled || false,
          model: aiSettings.model || '',
          apiKey: aiSettings.apiKey || '',
          endpoint: aiSettings.endpoint || '',
          systemPrompt: aiSettings.systemPrompt || '',
          typingDelay: aiSettings.typingDelay || 2000,
          minInputLength: aiSettings.minInputLength || 10
        };
        
        // 收集所有首选项
        const preferences = {
          themeMode: allPrefs.themeMode || 'system',
          editorFontSize: allPrefs.editorFontSize || 14,
          editorFontFamily: allPrefs.editorFontFamily || "'Microsoft YaHei', '微软雅黑', sans-serif",
          previewFontSize: allPrefs.previewFontSize || 14,
          previewFontFamily: allPrefs.previewFontFamily || "'Microsoft YaHei', '微软雅黑', sans-serif",
          noteSavePath: allPrefs.noteSavePath || await getDefaultSavePath(),
          language: allPrefs.language || 'zh-CN',
          aiSettings: completeAISettings,
          startupOnLogin: allPrefs.startupOnLogin || false
        };

        // 调用主进程导出
        const result = await ipcRenderer.invoke('export-preferences', preferences);
        const statusElement = document.getElementById('status');
        if (result.success) {
          if (statusElement) {
            statusElement.textContent = i18n.t('exportSuccess') + result.filePath;
          }
        } else {
          if (statusElement) {
            statusElement.textContent = i18n.t('exportFailed') + (result.error || error.message);
          }
        }
      } catch (error) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
          statusElement.textContent = i18n.t('exportFailed') + (error.message || error);
        }
      }
    });
  }

  // 导入按钮点击事件
  if (importBtn) {
    importBtn.addEventListener('click', async () => {
      try {
        // 显示确认对话框
        if (!confirm(i18n.t('importConfirm'))) {
          return;
        }
        const statusElement = document.getElementById('status');
        // 调用主进程导入
        const result = await ipcRenderer.invoke('import-preferences');
        if (result.success) {
          // 应用导入的首选项
          await applyImportedPreferences(result.preferences);

          // 重新加载设置
          const prefs = result.preferences;
          if (prefs.theme || prefs.themeMode) {
            const themeValue = prefs.theme || prefs.themeMode;
            document.getElementById('pref-theme-mode').value = themeValue;
            await ipcRenderer.invoke('preferences:set', 'themeMode', themeValue);
            applyThemeByMode(themeValue);
          }

          // 提示用户重启应用
          if (confirm(i18n.t('restartAppNotify'))) {
            await ipcRenderer.invoke('relaunch-app');
          }
        } else {
          if (statusElement) {
            statusElement.textContent = i18n.t('importFailed') + (result.error || error.message);
          }
        }
      } catch (error) {
        if (statusElement) {
          statusElement.textContent = i18n.t('importFailed') + (error.message || error);
        }
      }
    });
  }

  // 路径输入框设为只读
  const pathInput = document.getElementById('pref-note-save-path');
  if (pathInput) {
    pathInput.readOnly = true; // 确保输入框只读
    pathInput.addEventListener('click', () => {
      // 点击输入框时也触发浏览按钮点击
      const browseBtn = document.getElementById('browse-note-save-path');
      if (browseBtn) browseBtn.click();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      // 显示确认对话框
      if (confirm(i18n.t('resetConfirmNotify'))) {
        // 语言 -> zh-CN
        if (i18n) {
          try {
            await i18n.setLanguage('zh-CN');
            i18n.applyI18n();
          } catch { }
        }
        if (langSelect) langSelect.value = 'zh-CN';

        // 主题 -> 系统
        await ipcRenderer.invoke('preferences:set', 'themeMode', 'system');
        if (select) select.value = 'system';
        applyThemeByMode('system');

        // 字体 -> 14
        const defaultFontSize = 14;
        const defaultFontFamily = 'Arial, sans-serif';

        // 重置编辑器字体
        await applyEditorFont(defaultFontSize);
        await applyEditorFontFamily(defaultFontFamily);
        if (editorFontInput) editorFontInput.value = defaultFontSize;
        if (editorFontFamilySelect) editorFontFamilySelect.value = defaultFontFamily;

        // 重置预览字体
        await applyPreviewFont(defaultFontSize);
        await applyPreviewFontFamily(defaultFontFamily);
        if (previewFontInput) previewFontInput.value = defaultFontSize;
        if (previewFontFamilySelect) previewFontFamilySelect.value = defaultFontFamily;

        // 重置AI设置 - 恢复默认值
        const defaultAISettings = {
          enabled: false,
          typingDelay: 2000,
          minInputLength: 10,
          model: '',
          apiKey: '',
          endpoint: '',
          systemPrompt: ''
        };
        await ipcRenderer.invoke('preferences:set', 'aiSettings', defaultAISettings);
        
        // 清空所有 AI 输入框
        const aiEnabledInput = document.getElementById('pref-ai-enabled');
        const aiTypingDelayInput = document.getElementById('pref-ai-typing-delay');
        const aiTypingLengthInput = document.getElementById('pref-ai-typing-length');
        const systemPromptInput = document.getElementById('pref-ai-system-prompt');
        
        if (aiEnabledInput) aiEnabledInput.checked = false;
        if (aiTypingDelayInput) aiTypingDelayInput.value = 2000;
        if (aiTypingLengthInput) aiTypingLengthInput.value = 10;
        if (modelInput) modelInput.value = '';
        if (apiKeyInput) apiKeyInput.value = '';
        if (endpointInput) endpointInput.value = '';
        if (systemPromptInput) systemPromptInput.value = '';
        
        // 更新 AI 字段状态
        updateAIFieldsState();

        // 重置笔记保存路径
        const defaultPath = await getDefaultSavePath();
        await saveNoteSavePath(defaultPath, false);
      }
    });
  }

  if (sidebar) {
    sidebar.addEventListener('click', (e) => {
      const li = e.target.closest('li[data-pane]');
      if (!li) return;
      const key = li.getAttribute('data-pane');
      sidebar.querySelectorAll('li').forEach((n) => n.classList.remove('active'));
      li.classList.add('active');
      panes.forEach((p) => p.classList.remove('active'));
      const paneEl = document.getElementById(`pane-${key}`);
      if (paneEl) paneEl.classList.add('active');
      try { localStorage.setItem('prefActivePane', key); } catch { }
    });
  }
}

async function initPreferences() {
  // 从preferences.json 读取并应用主题模式
  const savedMode = await ipcRenderer.invoke('preferences:get', 'themeMode', 'system');
  applyThemeByMode(savedMode);

  // 初始化系统主题监听
  await setupSystemWatcher();

  // 从preferences.json 读取并应用字体大小
  const ef = await ipcRenderer.invoke('preferences:get', 'editorFontSize', 14);
  const pf = await ipcRenderer.invoke('preferences:get', 'previewFontSize', 14);
  if (!isNaN(ef)) document.documentElement.style.setProperty('--editor-font-size', `${ef}px`);
  if (!isNaN(pf)) document.documentElement.style.setProperty('--preview-font-size', `${pf}px`);

  // 从preferences.json 读取并应用字体
  const editorFont = await ipcRenderer.invoke('preferences:get', 'editorFontFamily', "'Microsoft YaHei', '微软雅黑', sans-serif");
  const previewFont = await ipcRenderer.invoke('preferences:get', 'previewFontFamily', "'Microsoft YaHei', '微软雅黑', sans-serif");
  if (editorFont) document.documentElement.style.setProperty('--editor-font-family', editorFont);
  if (previewFont) document.documentElement.style.setProperty('--preview-font-family', previewFont);

  // 字号快捷键：Ctrl+= / Ctrl+- / Ctrl+0
  window.addEventListener('keydown', async (e) => {
    if (!e.ctrlKey) return;
    const key = e.key;
    if (key === '=' || key === '+') {
      const cur = await ipcRenderer.invoke('preferences:get', 'editorFontSize', 14);
      await applyEditorFont(cur + 1);
      e.preventDefault();
    } else if (key === '-') {
      const cur = await ipcRenderer.invoke('preferences:get', 'editorFontSize', 14);
      await applyEditorFont(cur - 1);
      e.preventDefault();
    } else if (key === '0') {
      await applyEditorFont(14);
      e.preventDefault();
    }
  });

  // 确保ipcRenderer可用
  if (ipcRenderer) {
    ipcRenderer.on('open-preferences', () => {
      openModal();
    });
  } else {
    console.error('ipcRenderer is not available');
  }

  // 初始化模态框和事件
  const initUI = async () => {
    await ensureModalExists();
    bindEvents();

    // 初始化AI设置
    await loadAISettings();

    // 加载笔记保存路径
    await loadNoteSavePath();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI, { once: true });
  } else {
    initUI();
  }
}

// 获取当前保存的笔记路径
async function getNoteSavePath() {
  return await ipcRenderer.invoke('preferences:get', 'noteSavePath', '');
}

// 检查并创建笔记保存目录
async function ensureNoteSaveDir() {
  let savePath = await ipcRenderer.invoke('preferences:get', 'noteSavePath', null);
  if (!savePath) {
    savePath = await getDefaultSavePath();
    await ipcRenderer.invoke('preferences:set', 'noteSavePath', savePath);
  }

  // 确保目录存在
  if (!electronFs.existsSync(savePath)) {
    electronFs.mkdirSync(savePath, { recursive: true });
  }

  return savePath;
}

// 应用导入的首选项
async function applyImportedPreferences(prefs) {
  try {
    // 应用语言设置
    if (prefs.language && document.getElementById('pref-lang')) {
      document.getElementById('pref-lang').value = prefs.language;
      if (i18n) {
        await i18n.setLanguage(prefs.language);
      }
    }

    // 应用主题设置
    if (prefs.theme && document.getElementById('pref-theme-mode')) {
      document.getElementById('pref-theme-mode').value = prefs.theme;
      await ipcRenderer.invoke('preferences:set', 'themeMode', prefs.theme);
      applyThemeByMode(prefs.theme);
    }

    // 应用编辑器设置
    if (prefs.editor) {
      if (prefs.editor.fontSize && document.getElementById('pref-editor-font')) {
        document.getElementById('pref-editor-font').value = prefs.editor.fontSize;
        await applyEditorFont(prefs.editor.fontSize);
      }
      if (prefs.editor.fontFamily && document.getElementById('pref-editor-font-family')) {
        document.getElementById('pref-editor-font-family').value = prefs.editor.fontFamily;
        await applyEditorFontFamily(prefs.editor.fontFamily);
      }
    }

    // 应用预览设置
    if (prefs.preview) {
      if (prefs.preview.fontSize && document.getElementById('pref-preview-font')) {
        document.getElementById('pref-preview-font').value = prefs.preview.fontSize;
        await applyPreviewFont(prefs.preview.fontSize);
      }
      if (prefs.preview.fontFamily && document.getElementById('pref-preview-font-family')) {
        document.getElementById('pref-preview-font-family').value = prefs.preview.fontFamily;
        await applyPreviewFontFamily(prefs.preview.fontFamily);
      }
    }

    // 应用AI设置
    const aiSettings = prefs.aiSettings;
    if (aiSettings) {
      // 设置AI配置输入框
      const modelInput = document.getElementById('pref-ai-model');
      const apiKeyInput = document.getElementById('pref-ai-api-key');
      const endpointInput = document.getElementById('pref-ai-endpoint');
      const systemPromptInput = document.getElementById('pref-ai-system-prompt');
      const aiEnabledInput = document.getElementById('pref-ai-enabled');
      const aiTypingDelayInput = document.getElementById('pref-ai-typing-delay');
      const aiTypingLengthInput = document.getElementById('pref-ai-typing-length');
      
      // 更新输入框值
      if (modelInput) modelInput.value = aiSettings.model || '';
      if (apiKeyInput) apiKeyInput.value = aiSettings.apiKey || '';
      if (endpointInput) endpointInput.value = aiSettings.endpoint || '';
      if (systemPromptInput) systemPromptInput.value = aiSettings.systemPrompt || '';
      if (aiEnabledInput) aiEnabledInput.checked = aiSettings.enabled === true;
      if (aiTypingDelayInput) aiTypingDelayInput.value = aiSettings.typingDelay || 2000;
      if (aiTypingLengthInput) aiTypingLengthInput.value = aiSettings.minInputLength || 10;
      
      // 保存到 preferences.json
      await saveAISettings();
      
      // 更新AI字段状态
      updateAIFieldsState();
    }

    // 应用笔记保存路径
    if (prefs.noteSavePath && document.getElementById('pref-note-save-path')) {
      await saveNoteSavePath(prefs.noteSavePath, false);
    }

    // 应用开机自启设置
    if (typeof prefs.startupOnLogin !== 'undefined') {
      try {
        const res = await ipcRenderer.invoke('set-startup-enabled', !!prefs.startupOnLogin);
        if (res && res.success) {
          const checkbox = document.getElementById('pref-startup');
          if (checkbox) checkbox.checked = !!prefs.startupOnLogin;
        }
      } catch (e) {
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}
export {
  initPreferences,
  getNoteSavePath,
  ensureNoteSaveDir,
  applyImportedPreferences,
};

