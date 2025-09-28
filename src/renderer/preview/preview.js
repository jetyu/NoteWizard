import state from '../state.js';

const styleUrl = new URL('./preview.css', import.meta.url);
let styleInjected = false;

function ensureStyleInjected() {
  if (styleInjected) return;
  const styleId = 'preview-style';
  if (document.getElementById(styleId)) {
    styleInjected = true;
    return;
  }
  const link = document.createElement('link');
  link.id = styleId;
  link.rel = 'stylesheet';
  link.href = styleUrl.href;
  document.head.appendChild(link);
  styleInjected = true;
}

function renderPreview() {
  ensureStyleInjected();

  if (!state.editor) return;

  const previewElement = document.getElementById('preview');
  if (!previewElement) return;

  try {
    if (window.marked && typeof window.marked.parse === 'function') {
      previewElement.innerHTML = window.marked.parse(state.editor.getValue());
    } else {
      previewElement.textContent = state.editor.getValue();
    }
  } catch (error) {
    previewElement.textContent = state.editor.getValue();
    console.error('renderPreview failed:', error);
  }
}

function initPreview() {
  ensureStyleInjected();
  // 如果编辑器已经存在内容，初始化时渲染一次
  renderPreview();
}

export {
  initPreview,
  renderPreview,
};
