import state from './state.js';
import { getAIAssistant } from './ai-assistant.js';

function initializeEditor() {
  const editorElement = document.getElementById('editor');
  if (editorElement && !state.editor) {
    try {
      state.editor = CodeMirror.fromTextArea(editorElement, {
        mode: 'markdown',
        lineNumbers: true,
        lineWrapping: true,
        theme: 'default',
        inputStyle: 'contenteditable',
        autofocus: true,
        extraKeys: {
          'Ctrl-S': function () {
          },
          'Tab': function(cm) {
            // 处理Tab键：如果有AI建议，应用建议；否则插入制表符
            return handleTabKey(cm);
          },
          'Esc': function(cm) {
            // ESC键：取消AI建议
            return handleEscKey(cm);
          },
          'Ctrl-/': function(cm) {
            // Ctrl+/ 快捷键：隐藏AI建议
            hideAISuggestion();
          }
        },
      });

      // 初始化AI助手
      const aiAssistant = getAIAssistant();

      // 设置编辑器事件监听器
      setupEditorEventListeners(state.editor, aiAssistant);

      setTimeout(() => {
        if (state.editor) {
          state.editor.refresh();
          state.editor.focus();
          window.dispatchEvent(new Event('editor-ready'));
        }
      }, 100);

      return true;
    } catch (error) {
      console.error('初始化编辑器失败:', error);
      return false;
    }
  }
  return false;
}

// 设置编辑器事件监听器
function setupEditorEventListeners(editor, aiAssistant) {
  // 监听内容变化
  editor.on('change', function(cm, change) {
    // 触发内容变化事件
    const content = cm.getValue();
    const event = new CustomEvent('editor-content-changed', {
      detail: { content, change }
    });
    window.dispatchEvent(event);
  });

  // 监听光标变化
  editor.on('cursorActivity', function(cm) {
    const cursor = cm.getCursor();
    const event = new CustomEvent('editor-cursor-changed', {
      detail: { cursor }
    });
    window.dispatchEvent(event);
  });
}

// 处理Tab键
function handleTabKey(cm) {
  const aiAssistant = getAIAssistant();
  
  console.log('Tab键被按下, 当前AI建议:', aiAssistant?.currentSuggestion);

  // 如果有AI建议，应用建议
  if (aiAssistant && aiAssistant.currentSuggestion) {
    aiAssistant.applySuggestion();
    return false; // 阻止默认行为
  }

  // 否则执行默认的Tab行为（插入空格）
  const spaces = Array(3).fill(' ').join(''); // 插入3个空格
  cm.replaceSelection(spaces);
  return false;
}

// 处理ESC键
function handleEscKey(cm) {
  const aiAssistant = getAIAssistant();
  
  console.log('ESC键被按下, 当前AI建议:', aiAssistant?.currentSuggestion);
  
  // 如果有AI建议，取消建议
  if (aiAssistant && aiAssistant.currentSuggestion) {
    aiAssistant.hideSuggestion();
    return false; // 阻止默认行为
  }
  
  // 如果没有AI建议，允许默认ESC行为
  return CodeMirror.Pass;
}

// 隐藏AI建议
function hideAISuggestion() {
  const aiAssistant = getAIAssistant();
  if (aiAssistant) {
    aiAssistant.hideSuggestion();
  }
}

// 插入AI建议
function insertAISuggestion(cm, suggestion) {
  const cursor = cm.getCursor();
  const currentLine = cm.getLine(cursor.line);
  const lineContent = currentLine.substring(0, cursor.ch);

  // 如果当前行有内容且不以空格或标点结束，在建议前添加空格
  let suggestionToInsert = suggestion;
  if (lineContent && !/\s$/.test(lineContent) && !/[.,!?;:]$/.test(lineContent)) {
    suggestionToInsert = ' ' + suggestion;
  }

  // 插入建议
  cm.replaceRange(suggestionToInsert, cursor, cursor);

  // 移动光标到建议末尾
  const newCursorPos = {
    line: cursor.line,
    ch: cursor.ch + suggestionToInsert.length
  };
  cm.setCursor(newCursorPos);

  // 触发内容变化事件，可能会生成新的建议
  setTimeout(() => {
    const content = cm.getValue();
    const event = new CustomEvent('editor-content-changed', {
      detail: { content }
    });
    window.dispatchEvent(event);
  }, 100);
}

export function onDomReadyInitEditor() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEditor);
  } else {
    initializeEditor();
  }
}
export { initializeEditor };
