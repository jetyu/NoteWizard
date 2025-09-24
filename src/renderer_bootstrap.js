// Bootstrap entry for renderer process (modularized)
const { onDomReadyInitEditor } = require('./renderer/editor');
const { setupOutlineWhenReady } = require('./renderer/outline');
const { initializeFileWorkspace, setupEditorEvents } = require('./renderer/files');
const { setupToolbar } = require('./renderer/toolbar');
const { initI18n, applyI18n } = require('./renderer/i18n');
const { initPreferences } = require('./renderer/preferences');
const { initTrash } = require('./renderer/trash');
const { ipcRenderer } = require('electron');

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

function setupPreviewWidthPersistence() {
  const previewPanel = document.getElementById('preview-panel');
  if (!previewPanel) return;

  try {
    const storedWidth = localStorage.getItem('previewPanelWidth');
    if (storedWidth) {
      previewPanel.style.flex = '0 0 auto';
      previewPanel.style.width = storedWidth + 'px';
    }
  } catch {}
}

function setupPreviewLeftEdgeDrag() {
  const app = document.getElementById('app');
  const leftPanel = document.getElementById('left-panel');
  const editorPanel = document.getElementById('editor-panel');
  const previewPanel = document.getElementById('preview-panel');
  if (!app || !leftPanel || !editorPanel || !previewPanel) return;

  const EDGE_THRESHOLD = 8; // px
  let dragging = false;

  const getMinEditor = () => {
    const cssMin = parseInt(getComputedStyle(editorPanel).minWidth || '300', 10);
    return isNaN(cssMin) ? 300 : cssMin;
  };
  const getMinPreview = () => {
    const cssMin = parseInt(getComputedStyle(previewPanel).minWidth || '240', 10);
    return isNaN(cssMin) ? 240 : cssMin;
  };

  const updateCursor = (e) => {
    const rect = previewPanel.getBoundingClientRect();
    const nearLeftEdge = Math.abs(e.clientX - rect.left) <= EDGE_THRESHOLD;
    previewPanel.classList.toggle('edge-resize', nearLeftEdge);
  };

  const onMouseDown = (e) => {
    const rect = previewPanel.getBoundingClientRect();
    const nearLeftEdge = Math.abs(e.clientX - rect.left) <= EDGE_THRESHOLD;
    if (!nearLeftEdge) return;
    dragging = true;
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    const appRect = app.getBoundingClientRect();
    const leftRect = leftPanel.getBoundingClientRect();
    const available = appRect.width - leftRect.width; // editor + preview total
    const minEditor = getMinEditor();
    const minPreview = getMinPreview();
    let previewWidth = appRect.right - e.clientX;
    const maxPreview = Math.max(minPreview, available - minEditor);
    previewWidth = Math.min(Math.max(previewWidth, minPreview), maxPreview);
    previewPanel.style.flex = '0 0 auto';
    previewPanel.style.width = previewWidth + 'px';
    try { localStorage.setItem('previewPanelWidth', String(Math.round(previewWidth))); } catch {}
  };

  const onMouseUp = () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.userSelect = '';
  };

  previewPanel.addEventListener('mousemove', updateCursor);
  previewPanel.addEventListener('mouseleave', () => previewPanel.classList.remove('edge-resize'));
  previewPanel.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function setupPreviewIpcHandlers() {
  const previewPanel = document.getElementById('preview-panel');
  const editorPanel = document.getElementById('editor-panel');
  if (!previewPanel || !editorPanel) return;

  const saveCurrentPreviewWidth = () => {
    const w = Math.round(previewPanel.getBoundingClientRect().width);
    if (w > 0) {
      try { localStorage.setItem('previewPanelWidth', String(w)); } catch {}
    }
  };

  const showPreview = () => {
    try {
      const saved = parseInt(localStorage.getItem('previewPanelWidth'), 10);
      if (!isNaN(saved) && saved > 0) {
        previewPanel.style.flex = '0 0 auto';
        previewPanel.style.width = saved + 'px';
      }
    } catch {}
    previewPanel.style.display = '';
    try { ipcRenderer.send('preview-state-changed', { visible: true }); } catch {}
  };

  const hidePreview = () => {
    saveCurrentPreviewWidth();
    previewPanel.style.display = 'none';
    editorPanel.style.flex = '1 1 auto';
    editorPanel.style.width = '';
    try { ipcRenderer.send('preview-state-changed', { visible: false }); } catch {}
  };

  ipcRenderer.removeAllListeners('preview-show');
  ipcRenderer.removeAllListeners('preview-hide');
  ipcRenderer.removeAllListeners('preview-toggle');
  ipcRenderer.on('preview-show', showPreview);
  ipcRenderer.on('preview-hide', hidePreview);
  ipcRenderer.on('preview-toggle', () => {
    const isHidden = previewPanel.style.display === 'none';
    if (isHidden) {
      showPreview();
    } else {
      hidePreview();
    }
  });
}

function bootstrap() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupLeftPanelUI();
      setupPreviewWidthPersistence();
      setupPreviewLeftEdgeDrag();
      setupPreviewIpcHandlers();
      initI18n();
      applyI18n();
      onDomReadyInitEditor();
      initializeFileWorkspace();
      setupEditorEvents();
      setupToolbar();
      initPreferences();
      initTrash();
      setupOutlineWhenReady();
      try {
        const visible = document.getElementById('preview-panel')?.style.display !== 'none';
        ipcRenderer.send('preview-state-changed', { visible });
      } catch {}
    });
  } else {
    setupLeftPanelUI();
    setupPreviewWidthPersistence();
    setupPreviewLeftEdgeDrag();
    setupPreviewIpcHandlers();
    initI18n();
    applyI18n();
    onDomReadyInitEditor();
    initializeFileWorkspace();
    setupEditorEvents();
    setupToolbar();
    initPreferences();
    initTrash();
    setupOutlineWhenReady();
    try {
      const visible = document.getElementById('preview-panel')?.style.display !== 'none';
      ipcRenderer.send('preview-state-changed', { visible });
    } catch {}
  }
}

bootstrap();
