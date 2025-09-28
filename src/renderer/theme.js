function getStoredMode() {
  return localStorage.getItem('themeMode');
}

function storeMode(mode) {
  localStorage.setItem('themeMode', mode);
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
  const handler = () => {
    const mode = getStoredMode() || 'system';
    if (mode === 'system') {
      applyThemeByMode(mode);
    }
  };
  if (mq.addEventListener) mq.addEventListener('change', handler);
  else if (mq.addListener) mq.addListener(handler);
}

function initTheme() {
  const stored = getStoredMode();
  const initialMode = stored || 'system';
  applyThemeByMode(initialMode);
  setupSystemListener();

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#theme-toggle');
    if (!btn) return;
    const current = getStoredMode() || 'system';
    const next = cycleMode(current);
    storeMode(next);
    applyThemeByMode(next);
  });
}

export {
  initTheme,
  applyThemeByMode,
};
