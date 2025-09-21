// Bootstrap entry for renderer process (modularized)
const { onDomReadyInitEditor } = require('./renderer/editor');
const { setupOutlineWhenReady } = require('./renderer/outline');
const { initializeFileWorkspace, setupEditorEvents } = require('./renderer/files');
const { setupToolbar } = require('./renderer/toolbar');
const { initI18n, applyI18n } = require('./renderer/i18n');
const { initPreferences } = require('./renderer/preferences');
const { initTrash } = require('./renderer/trash');

function setupLeftPanelUI() {
  const leftPanel = document.getElementById('left-panel');
  const collapseBtn = document.getElementById('collapse-btn');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  if (collapseBtn && leftPanel) {
    // The icon is now managed by CSS
    collapseBtn.setAttribute('aria-label', '折叠面板');
    collapseBtn.title = '折叠面板';
    
    collapseBtn.addEventListener('click', () => {
      leftPanel.classList.toggle('collapsed');
      const isCollapsed = leftPanel.classList.contains('collapsed');
      collapseBtn.setAttribute('aria-label', isCollapsed ? '展开面板' : '折叠面板');
      collapseBtn.title = isCollapsed ? '展开面板' : '折叠面板';
    });
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      tabContents.forEach((content) => {
        content.classList.remove('active');
        if (content.id === `${targetTab}-tab`) {
          content.classList.add('active');
        }
      });
    });
  });
}

function bootstrap() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupLeftPanelUI();
      initI18n();
      applyI18n();
      onDomReadyInitEditor();
      initializeFileWorkspace();
      setupEditorEvents();
      setupToolbar();
      initPreferences();
      initTrash();
      setupOutlineWhenReady();
    });
  } else {
    setupLeftPanelUI();
    initI18n();
    applyI18n();
    onDomReadyInitEditor();
    initializeFileWorkspace();
    setupEditorEvents();
    setupToolbar();
    initPreferences();
    initTrash();
    setupOutlineWhenReady();
  }
}

bootstrap();
