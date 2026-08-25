import { syntaxTree } from '@codemirror/language';
import type { SyntaxNode } from '@lezer/common';
import type { EditorView } from '@codemirror/view';
import { ref, shallowRef } from 'vue';
import {
  clearAiSuggestion,
  getLastSuggestionClearTime,
  hasSuggestion,
  showAiSuggestion,
} from '@renderer/core/ai/wordsAutoCompletion';
import {
  EDITOR_CHANGE_ORIGIN,
  type EditorChangeOrigin,
} from '@renderer/core/editor/createCodeEditor';
import { createLogger } from '@renderer/features/logger';
import { getErrorMessage } from '@shared/utils/error.utils';
import { aiService } from '../services/ai.service';
import {
  buildAiCompletionContext,
  sanitizeAiCompletionSuggestion,
} from '../services/aiCompletion.service';
import { AI_ASSISTANT_DEFAULTS, AI_WRITING_MODE_CONFIG, type AiWritingMode } from '../constants/ai.constants';

const aiAssistantLogger = createLogger('AiAssistant');
const PUNCTUATION_ONLY_REGEX = /^[\p{P}\p{S}\s]*$/u;
const MEANINGFUL_TEXT_REGEX = /[\p{L}\p{N}\u4E00-\u9FFF]/u;
const BLOCKED_SYNTAX_NODES = new Set([
  'FencedCode',
  'CodeBlock',
  'CodeText',
  'InlineCode',
  'Table',
  'TableHeader',
  'TableDelimiter',
  'TableRow',
  'TableCell',
  'TaskMarker',
  'ListMark',
]);

export interface AiAssistantState {
  isEnabled: boolean;
  isSuspended: boolean;
  isProcessing: boolean;
  lastError: string | null;
}

interface AiAssistantRuntimeConfig {
  aiAssistant?: {
    enabled: boolean;
    triggerMode?: AiWritingMode;
    autoContinue?: boolean;
  };
}

export interface AiAssistantDocumentContext {
  noteId: string | null;
  noteTitle?: string;
  suggestionHint?: string;
}

interface CompletionSnapshot {
  requestId: number;
  noteId: string | null;
  documentText: string;
  cursorPosition: number;
}

function isAutoContinueEnabled(config: AiAssistantRuntimeConfig): boolean {
  return config.aiAssistant?.enabled === true && config.aiAssistant.autoContinue === true;
}

function isMeaningfulInput(context: string): boolean {
  const trimmed = context.trim();
  if (!trimmed) {
    return false;
  }
  if (PUNCTUATION_ONLY_REGEX.test(trimmed)) {
    return false;
  }
  return MEANINGFUL_TEXT_REGEX.test(trimmed);
}

function isDocumentMeaningful(docText: string): boolean {
  const trimmed = docText.trim();
  return Boolean(trimmed) && !PUNCTUATION_ONLY_REGEX.test(trimmed);
}

function isInsideCodeFence(beforeCursor: string): boolean {
  const fenceMatches = beforeCursor.match(/```/g);
  return Boolean(fenceMatches && fenceMatches.length % 2 === 1);
}

function isStructuredCursorPosition(editorView: EditorView): boolean {
  const state = editorView.state;
  const cursorPos = state.selection.main.head;
  const tree = syntaxTree(state);
  let node: SyntaxNode | null = tree.resolveInner(Math.max(0, cursorPos - 1), -1);

  while (node) {
    if (BLOCKED_SYNTAX_NODES.has(node.name)) {
      return true;
    }
    node = node.parent;
  }

  const docText = state.doc.toString();
  const beforeCursor = docText.slice(0, cursorPos);
  const currentLinePrefix = beforeCursor.split('\n').at(-1) ?? '';
  const currentLineStart = beforeCursor.lastIndexOf('\n') + 1;
  const currentLine = docText.slice(currentLineStart).split('\n')[0] ?? '';

  if (isInsideCodeFence(beforeCursor)) {
    return true;
  }

  if (/^\s*(?:[-*+]|\d+\.)\s*$/.test(currentLinePrefix)) {
    return true;
  }

  if (/^\s*[-*+]\s+\[[ xX]\]\s*$/.test(currentLinePrefix)) {
    return true;
  }

  if (/^\s*\|.+\|\s*$/.test(currentLine)) {
    return true;
  }

  if (/^\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+$/.test(currentLine)) {
    return true;
  }

  return false;
}

export function useAiAssistant() {
  const state = ref<AiAssistantState>({
    isEnabled: false,
    isSuspended: false,
    isProcessing: false,
    lastError: null,
  });

  const editorViewRef = shallowRef<EditorView | null>(null);
  let typingTimer: ReturnType<typeof setTimeout> | null = null;
  let requestSequence = 0;
  let documentContext: AiAssistantDocumentContext = { noteId: null };
  let hasShownSuggestionHint = false;

  const invalidatePendingWork = (clearSuggestion: boolean) => {
    requestSequence += 1;
    if (typingTimer) {
      clearTimeout(typingTimer);
      typingTimer = null;
    }
    state.value.isProcessing = false;

    if (clearSuggestion && editorViewRef.value) {
      clearAiSuggestion(editorViewRef.value);
    }
  };

  const isSnapshotCurrent = (editorView: EditorView, snapshot: CompletionSnapshot): boolean => {
    if (snapshot.requestId !== requestSequence || editorViewRef.value !== editorView) {
      return false;
    }
    if (documentContext.noteId !== snapshot.noteId) {
      return false;
    }

    const selection = editorView.state.selection.main;
    return selection.empty
      && selection.head === snapshot.cursorPosition
      && editorView.state.doc.toString() === snapshot.documentText;
  };

  const isEligibleForCompletion = (
    editorView: EditorView,
    config: AiAssistantRuntimeConfig,
    continuous: boolean,
  ): boolean => {
    if (!isAutoContinueEnabled(config) || state.value.isSuspended) return false;

    const editorState = editorView.state;
    if (hasSuggestion(editorState)) return false;
    if (!editorState.selection.main.empty) return false;
    if (editorState.readOnly) return false;

    const mode = (config.aiAssistant?.triggerMode || 'standard') as AiWritingMode;
    const modeConfig = AI_WRITING_MODE_CONFIG[mode] || AI_WRITING_MODE_CONFIG.standard;
    if (!continuous) {
      const timeSinceClear = Date.now() - getLastSuggestionClearTime();
      if (timeSinceClear < modeConfig.cooldown) return false;
    }

    const documentText = editorState.doc.toString();
    if (!isDocumentMeaningful(documentText)) return false;

    const promptContext = buildAiCompletionContext({
      documentText,
      cursorPosition: editorState.selection.main.head,
      noteTitle: documentContext.noteTitle,
    });
    if (!isMeaningfulInput(promptContext.context)) return false;
    if (isStructuredCursorPosition(editorView)) return false;

    return true;
  };

  const requestCompletion = async (
    editorView: EditorView,
    config: AiAssistantRuntimeConfig,
    continuous = false,
  ) => {
    if (!isEligibleForCompletion(editorView, config, continuous)) {
      return;
    }

    const editorState = editorView.state;
    const documentText = editorState.doc.toString();
    const cursorPosition = editorState.selection.main.head;
    const promptContext = buildAiCompletionContext({
      documentText,
      cursorPosition,
      noteTitle: documentContext.noteTitle,
    });
    const requestId = requestSequence + 1;
    requestSequence = requestId;
    const snapshot: CompletionSnapshot = {
      requestId,
      noteId: documentContext.noteId,
      documentText,
      cursorPosition,
    };

    state.value.isProcessing = true;
    state.value.lastError = null;

    try {
      const result = await aiService.generateCompletion(promptContext);
      if (!isSnapshotCurrent(editorView, snapshot) || state.value.isSuspended) {
        return;
      }

      if (result.success && result.answer) {
        const suggestion = sanitizeAiCompletionSuggestion(promptContext, result.answer);
        if (suggestion) {
          const suggestionHint = hasShownSuggestionHint
            ? undefined
            : documentContext.suggestionHint;
          if (suggestionHint) {
            hasShownSuggestionHint = true;
            showAiSuggestion(editorView, suggestion, suggestionHint);
          } else {
            showAiSuggestion(editorView, suggestion);
          }
        }
      } else {
        state.value.lastError = result.error || 'Completion failed';
        aiAssistantLogger.warn(`Completion failed: ${result.error || 'Unknown failure'}`);
      }
    } catch (error) {
      if (!isSnapshotCurrent(editorView, snapshot) || state.value.isSuspended) {
        return;
      }

      state.value.lastError = getErrorMessage(error);
      aiAssistantLogger.error(`Error: ${getErrorMessage(error)}`);
    } finally {
      if (requestId === requestSequence) {
        state.value.isProcessing = false;
      }
    }
  };

  const scheduleCompletion = (
    editorView: EditorView,
    config: AiAssistantRuntimeConfig,
    continuous: boolean,
  ) => {
    if (!isEligibleForCompletion(editorView, config, continuous)) {
      return;
    }

    const mode = (config.aiAssistant?.triggerMode || 'standard') as AiWritingMode;
    const modeConfig = AI_WRITING_MODE_CONFIG[mode] || AI_WRITING_MODE_CONFIG.standard;
    const delay = continuous
      ? Math.max(
          AI_ASSISTANT_DEFAULTS.MIN_CONTINUOUS_COMPLETION_DELAY,
          Math.round(modeConfig.delay * AI_ASSISTANT_DEFAULTS.CONTINUOUS_COMPLETION_DELAY_RATIO),
        )
      : modeConfig.delay;
    const scheduledSequence = requestSequence;
    typingTimer = setTimeout(() => {
      typingTimer = null;
      if (scheduledSequence !== requestSequence || !isEligibleForCompletion(editorView, config, continuous)) {
        return;
      }
      void requestCompletion(editorView, config, continuous);
    }, delay);
  };

  const handleDocumentChange = (
    editorView: EditorView,
    config: AiAssistantRuntimeConfig,
    origin: EditorChangeOrigin,
  ) => {
    const preserveSuggestion = origin === EDITOR_CHANGE_ORIGIN.AI_PARTIAL_ACCEPT;
    invalidatePendingWork(!preserveSuggestion);

    if (!isAutoContinueEnabled(config) || state.value.isSuspended) {
      return;
    }
    if (origin === EDITOR_CHANGE_ORIGIN.TYPING) {
      scheduleCompletion(editorView, config, false);
      return;
    }
    if (origin === EDITOR_CHANGE_ORIGIN.AI_COMPLETE_ACCEPT) {
      scheduleCompletion(editorView, config, true);
    }
  };

  const handleSelectionChange = () => {
    invalidatePendingWork(true);
  };

  const cleanup = () => {
    invalidatePendingWork(true);
  };

  const setEnabled = (enabled: boolean) => {
    state.value.isEnabled = enabled;
    if (!enabled) {
      cleanup();
    }
  };

  const setSuspended = (suspended: boolean) => {
    if (state.value.isSuspended === suspended) {
      return;
    }

    state.value.isSuspended = suspended;
    if (suspended) {
      cleanup();
    }
  };

  const setEditorView = (view: EditorView | null) => {
    editorViewRef.value = view;
  };

  const setDocumentContext = (nextContext: AiAssistantDocumentContext) => {
    if (
      documentContext.noteId !== nextContext.noteId
      || documentContext.noteTitle !== nextContext.noteTitle
    ) {
      invalidatePendingWork(true);
    }
    documentContext = nextContext;
  };

  return {
    state,
    requestCompletion,
    handleDocumentChange,
    handleSelectionChange,
    cleanup,
    setEnabled,
    setSuspended,
    setEditorView,
    setDocumentContext,
    cancelRequest: () => invalidatePendingWork(false),
  };
}
