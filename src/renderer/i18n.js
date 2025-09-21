const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

const STORAGE_KEY = "lang";
const DEFAULT_LANG = "zh-CN";
const LOCALES_PATH = path.join(__dirname, '../locales');

// 存储所有加载的语言包
const dict = {};
let currentLang = DEFAULT_LANG;

// 加载语言包
async function loadLanguage(lang) {
  try {
    const filePath = path.join(LOCALES_PATH, `${lang}.json`);
    const data = await fs.promises.readFile(filePath, 'utf8');
    dict[lang] = JSON.parse(data);
    return dict[lang];
  } catch (error) {
    return loadLanguage(DEFAULT_LANG);
  }
}

// 初始化语言包
async function initLanguage() {
  try {
    currentLang = localStorage.getItem(STORAGE_KEY) || navigator.language || DEFAULT_LANG;
    // 确保语言在支持的语言列表中
    const supportedLangs = getSupportedLanguages();
    if (!supportedLangs.includes(currentLang)) {
      // 尝试匹配基础语言代码
      const baseLang = currentLang.split('-')[0];
      const matchedLang = supportedLangs.find(lang => lang.startsWith(baseLang));
      currentLang = matchedLang || DEFAULT_LANG;
    }
    
    // 加载语言包
    await loadLanguage(currentLang);
    
    // 更新HTML lang属性
    document.documentElement.lang = currentLang;
    
    return currentLang;
  } catch (error) {
    currentLang = DEFAULT_LANG;
    await loadLanguage(DEFAULT_LANG);
    return currentLang;
  }
}

async function getLanguage() {
  return currentLang;
}

async function setLanguage(lang) {
  if (lang === currentLang) return currentLang;
  
  try {
    if (!dict[lang]) {
      await loadLanguage(lang);
    }
    
    // 更新当前语言
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    
    // 应用新的语言
    await applyI18n();
    
    // 通知主进程语言已更改
    ipcRenderer.send('language-changed', lang);
    
    return lang;
  } catch (error) {
    // 设置失败，回退到默认语言
    if (lang !== DEFAULT_LANG) {
      return setLanguage(DEFAULT_LANG);
    }
    throw error;
  }
}

function t(key) {
  // 如果当前语言包中找不到，尝试从默认语言包中获取
  return dict[currentLang]?.[key] || dict[DEFAULT_LANG]?.[key] || key;
}

async function applyI18n() {
  if (!dict[currentLang]) {
    await loadLanguage(currentLang);
  }

  // 更新所有带有data-i18n属性的元素
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  // 更新所有带有data-i18n-placeholder属性的元素
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) {
      el.placeholder = t(key);
    }
  });

  // 更新所有带有data-i18n-title属性的元素
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key) {
      el.title = t(key);
    }
  });

  // 更新HTML lang属性
  document.documentElement.lang = currentLang;
  
  // 触发自定义事件，通知其他模块语言已更改
  const event = new CustomEvent('languageChanged', { detail: { lang: currentLang } });
  window.dispatchEvent(event);
}

async function initI18n() {
  try {
    // 初始化语言
    await initLanguage();
    
    // 应用当前语言
    await applyI18n();
    
    // 监听语言切换事件
    ipcRenderer.on('change-language', async (event, lang) => {
      await setLanguage(lang);
    });
    
    return currentLang;
  } catch (error) {
    console.error('Failed to initialize i18n', error);
    return DEFAULT_LANG;
  }
}

async function ensureI18nInitialized() {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY);
      if (savedLang) {
        await setLanguage(savedLang);
      } else {
        await initI18n();
      }
    } catch (error) {
      await setLanguage(DEFAULT_LANG);
    }
    return currentLang;
  }



// 启动时初始化
document.addEventListener('DOMContentLoaded', () => {
  ensureI18nInitialized().catch(() => {});
});

// 加载语言提供者配置
let localesProviders = {};
try {
  const localesProvidersPath = path.join(__dirname, '../config/locales-providers.json');
  if (fs.existsSync(localesProvidersPath)) {
    localesProviders = JSON.parse(fs.readFileSync(localesProvidersPath, 'utf8'));
  }
} catch (error) {
  // 静默失败
}

// 获取语言显示名称
function getLanguageDisplayName(lang) {
  return localesProviders[lang] || lang;
}

// 获取支持的语言列表
function getSupportedLanguagesWithNames() {
  try {
    const supportedLangs = fs.readdirSync(LOCALES_PATH)
      .filter(file => file.endsWith('.json'))
      .map(file => path.basename(file, '.json'));
    
    return supportedLangs.map(code => ({
      code,
      name: getLanguageDisplayName(code) || code
    }));
  } catch (error) {
    return [{ code: DEFAULT_LANG, name: getLanguageDisplayName(DEFAULT_LANG) }];
  }
}

// 导出API
module.exports = {
  getLanguage,
  setLanguage,
  t,
  applyI18n,
  initI18n,
  STORAGE_KEY,
  DEFAULT_LANG,
  get currentLanguage() {
    return currentLang;
  },
  ensureInitialized: ensureI18nInitialized,
  getCurrentLanguageName: () => getLanguageDisplayName(currentLang),
  getSupportedLanguages: () => {
    try {
      return fs.readdirSync(LOCALES_PATH)
        .filter(file => file.endsWith('.json'))
        .map(file => path.basename(file, '.json'));
    } catch (error) {
      return [DEFAULT_LANG];
    }
  },
  getSupportedLanguagesWithNames,
  getLanguageDisplayName
};
