import state from './state.js';

export function renderPreview() {
  if (state.editor) {
    const el = document.getElementById('preview');
    if (el && window.marked) {
      el.innerHTML = marked.parse(state.editor.getValue());
    }
  }
}
