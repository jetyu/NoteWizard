import state from './state.js';
import { renderPreview } from './preview/preview.js';

function wrapSelection(before, after = before) {
  if (!state.editor) return;
  const doc = state.editor.getDoc();
  const sel = doc.getSelection();
  if (sel) {
    doc.replaceSelection(`${before}${sel}${after}`, 'around');
  } else {
    const cursor = doc.getCursor();
    doc.replaceRange(`${before}${after}`, cursor);
    doc.setCursor({ line: cursor.line, ch: cursor.ch + before.length });
  }
  state.editor.focus();
}

function insertLinePrefix(prefix) {
  if (!state.editor) return;
  const doc = state.editor.getDoc();
  const selections = doc.listSelections();
  selections.forEach((range) => {
    const from = { line: Math.min(range.anchor.line, range.head.line), ch: 0 };
    const to = { line: Math.max(range.anchor.line, range.head.line), ch: 0 };
    for (let l = from.line; l <= to.line; l++) {
      doc.replaceRange(prefix, { line: l, ch: 0 });
    }
  });
  state.editor.focus();
}

function insertBlock(text) {
  if (!state.editor) return;
  const doc = state.editor.getDoc();
  const cursor = doc.getCursor();
  const insertText = `\n${text}\n`;
  doc.replaceRange(insertText, cursor);
  state.editor.focus();
}

function insertTable() { insertBlock('| Col1 | Col2 |\n| --- | --- |\n| Val1 | Val2 |'); }
function insertLink() { wrapSelection('[', '](http://)'); }
function insertImage() {
  if (!state.editor) return;
  const doc = state.editor.getDoc();
  const cursor = doc.getCursor();
  doc.replaceRange('![](http://)', cursor);
  state.editor.focus();
}

function setupToolbar() {
  const toolbar = document.getElementById('toolbar');
  if (!toolbar) return;

  toolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const act = btn.dataset.act;
    switch (act) {
      case 'bold':
        wrapSelection('**');
        break;
      case 'italic':
        wrapSelection('*');
        break;
      case 'strike':
        wrapSelection('~~');
        break;
      case 'h1':
        insertLinePrefix('# ');
        break;
      case 'h2':
        insertLinePrefix('## ');
        break;
      case 'ul':
        insertLinePrefix('- ');
        break;
      case 'ol':
        insertLinePrefix('1. ');
        break;
      case 'task':
        insertLinePrefix('- [ ] ');
        break;
      case 'quote':
        insertLinePrefix('> ');
        break;
      case 'code':
        insertBlock('```\ncode\n```');
        break;
      case 'table':
        insertTable();
        break;
      case 'link':
        insertLink();
        break;
      case 'image':
        insertImage();
        break;
      default:
        break;
    }
    renderPreview();
  });
}

export { setupToolbar };
