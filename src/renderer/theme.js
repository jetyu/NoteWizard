const electronAPI = window.electronAPI;
const { ipcRenderer } = electronAPI;

async function getStoredMode() {
  return await ipcRenderer.invoke('preferences:get', 'themeMode', null);
}

async function storeMode(mode) {
  await ipcRenderer.invoke('preferences:set', 'themeMode', mode);
}

function getSystemPrefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyThemeByMode(mode) {
  const root = document.documentElement;
  let effective = mode;
  if (mode === 'system' || !mode) {
    effective = getSystemPrefersDark() ? 'dark' : 'light';
  }
  if (effective === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
}
 

function cycleMode(mode) {
  if (mode === 'light') return 'dark';
  if (mode === 'dark') return 'system';
  return 'light';
}

function setupSystemListener() {
  if (!window.matchMedia) return;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = async () => {
    const mode = await getStoredMode() || 'system';
    if (mode === 'system') {
      applyThemeByMode(mode);
    }
  };
  if (mq.addEventListener) mq.addEventListener('change', handler);
  else if (mq.addListener) mq.addListener(handler);
}

async function initTheme() {
  const stored = await getStoredMode();
  const initialMode = stored || 'system';
  applyThemeByMode(initialMode);
  setupSystemListener();

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('#theme-toggle');
    if (!btn) return;
    const current = await getStoredMode() || 'system';
    const next = cycleMode(current);
    await storeMode(next);
    applyThemeByMode(next);
  });
}

export {
  initTheme,
  applyThemeByMode,
};
