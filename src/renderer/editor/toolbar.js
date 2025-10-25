import state from '../state.js';
import { renderPreview } from '../preview/preview.js';

// 常量定义
const MARKDOWN_TEMPLATES = {
  TABLE: '| Col1 | Col2 |\n| --- | --- |\n| Val1 | Val2 |',
  CODE_BLOCK: '```\ncode\n```',
  IMAGE: '![](http://)',
  LINK_SUFFIX: '](http://)'
};

// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 防抖的预览渲染函数（延迟 150ms）
const debouncedRenderPreview = debounce(renderPreview, 150);

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
  
  // 使用 operation 批量更新，减少重绘次数
  state.editor.operation(() => {
    const selections = doc.listSelections();
    selections.forEach((range) => {
      const from = { line: Math.min(range.anchor.line, range.head.line), ch: 0 };
      const to = { line: Math.max(range.anchor.line, range.head.line), ch: 0 };
      for (let l = from.line; l <= to.line; l++) {
        doc.replaceRange(prefix, { line: l, ch: 0 });
      }
    });
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

function insertTable() { insertBlock(MARKDOWN_TEMPLATES.TABLE); }
function insertLink() { wrapSelection('[', MARKDOWN_TEMPLATES.LINK_SUFFIX); }
function insertImage() {
  if (!state.editor) return;
  const doc = state.editor.getDoc();
  const cursor = doc.getCursor();
  doc.replaceRange(MARKDOWN_TEMPLATES.IMAGE, cursor);
  state.editor.focus();
}

// 使用 Map 提升查找效率
const toolbarActions = new Map([
  ['bold', () => wrapSelection('**')],
  ['italic', () => wrapSelection('*')],
  ['strike', () => wrapSelection('~~')],
  ['h1', () => insertLinePrefix('# ')],
  ['h2', () => insertLinePrefix('## ')],
  ['ul', () => insertLinePrefix('- ')],
  ['ol', () => insertLinePrefix('1. ')],
  ['task', () => insertLinePrefix('- [ ] ')],
  ['quote', () => insertLinePrefix('> ')],
  ['code', () => insertBlock(MARKDOWN_TEMPLATES.CODE_BLOCK)],
  ['table', insertTable],
  ['link', insertLink],
  ['image', insertImage]
]);

function setupToolbar() {
  const toolbar = document.getElementById('toolbar');
  if (!toolbar) return;

  toolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    const act = btn.dataset.act;
    const action = toolbarActions.get(act);
    
    if (action) {
      action();
      // 使用防抖优化预览渲染
      debouncedRenderPreview();
    }
  });
}

export { setupToolbar };
