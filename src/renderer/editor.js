const state = require('./state');

function initializeEditor() {
  const editorElement = document.getElementById('editor');
  if (editorElement && !state.editor) {
    try {
      state.editor = CodeMirror.fromTextArea(editorElement, {
        mode: 'markdown',
        lineNumbers: true,
        lineWrapping: true,
        theme: 'default',
        autofocus: true,
        extraKeys: {
          'Ctrl-S': function () {
          },
        },
      });

      setTimeout(() => {
        if (state.editor) {
          state.editor.refresh();
          state.editor.focus();
          window.dispatchEvent(new Event('editor-ready'));
        }
      }, 100);

      return true;
    } catch (error) {
      return false;
    }
  }
  return false;
}

function onDomReadyInitEditor() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEditor);
  } else {
    initializeEditor();
  }
}

module.exports = {
  initializeEditor,
  onDomReadyInitEditor,
};
