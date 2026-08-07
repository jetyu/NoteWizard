import type { EditorView } from '@codemirror/view';
import { computed, ref } from 'vue';
import { AI_PROMPT_PRESETS, type AiPromptPreset } from '@shared/ai.constants';
import { getErrorMessage } from '@shared/utils/error.utils';
import {
  clearEditorAiOperationAnchor,
  getEditorAiOperationAnchor,
  setEditorAiOperationAnchor,
} from '@renderer/core/ai/writingBuddyOperation';
import { aiService } from '@renderer/features/ai/services/ai.service';
import { createLogger } from '@renderer/features/logger';
import {
  showNativeEditorContextMenu,
  getEditorContextMenu,
  executeEditorAction,
  hasSelection as checkHasSelection,
  type EditorContextAction,
} from '../services/editorContextMenu.service';
import { EDITOR_CONSTANTS } from '../constants/editor.constants';

const logger = createLogger('Editor Context Menu');

const AI_ACTIONS = [
  EDITOR_CONSTANTS.ACTIONS.AI_REWRITE,
  EDITOR_CONSTANTS.ACTIONS.AI_EXPAND,
  EDITOR_CONSTANTS.ACTIONS.AI_SIMPLIFY,
  EDITOR_CONSTANTS.ACTIONS.AI_SUMMARIZE,
] as const;

type EditorAiAction = (typeof AI_ACTIONS)[number];
export type EditorAiOperationStatus = 'pending' | 'preview' | 'error';

interface EditorAiOperationConfig {
  labelKey: string;
  promptPreset: AiPromptPreset;
}

export interface EditorAiOperationState {
  id: number;
  status: EditorAiOperationStatus;
  action: EditorAiAction;
  actionLabelKey: string;
  promptPreset: AiPromptPreset;
  noteId: string;
  sourceText: string;
  result?: string;
  error?: string;
  canRetry: boolean;
}

interface UseEditorContextMenuOptions {
  t: (key: string, named?: Record<string, unknown>) => string;
  editorView: () => EditorView | null;
  activeNoteId: () => string | null;
  aiAssistantEnabled: () => boolean;
}

const AI_OPERATION_CONFIG: Record<EditorAiAction, EditorAiOperationConfig> = {
  [EDITOR_CONSTANTS.ACTIONS.AI_REWRITE]: {
    labelKey: EDITOR_CONSTANTS.MENU.AI_REWRITE,
    promptPreset: AI_PROMPT_PRESETS.EDITOR_REWRITE,
  },
  [EDITOR_CONSTANTS.ACTIONS.AI_EXPAND]: {
    labelKey: EDITOR_CONSTANTS.MENU.AI_EXPAND,
    promptPreset: AI_PROMPT_PRESETS.EDITOR_EXPAND,
  },
  [EDITOR_CONSTANTS.ACTIONS.AI_SIMPLIFY]: {
    labelKey: EDITOR_CONSTANTS.MENU.AI_SIMPLIFY,
    promptPreset: AI_PROMPT_PRESETS.EDITOR_SIMPLIFY,
  },
  [EDITOR_CONSTANTS.ACTIONS.AI_SUMMARIZE]: {
    labelKey: EDITOR_CONSTANTS.MENU.AI_SUMMARIZE,
    promptPreset: AI_PROMPT_PRESETS.EDITOR_SUMMARIZE,
  },
};

function isEditorAiAction(action: EditorContextAction): action is EditorAiAction {
  return AI_ACTIONS.some((aiAction) => aiAction === action);
}

export function useEditorContextMenu(options: UseEditorContextMenuOptions) {
  const aiOperation = ref<EditorAiOperationState | null>(null);
  const hasActiveAiOperation = computed(() => aiOperation.value !== null);
  let activeOperationView: EditorView | null = null;
  let nextOperationId = 1;
  let requestToken = 0;

  function hasValidSource(operation: EditorAiOperationState, view: EditorView): boolean {
    const anchor = getEditorAiOperationAnchor(view.state);
    return options.editorView() === view
      && options.activeNoteId() === operation.noteId
      && anchor?.operationId === operation.id
      && anchor.valid
      && view.state.doc.sliceString(anchor.from, anchor.to) === operation.sourceText;
  }

  function showSourceChangedError(operation: EditorAiOperationState): void {
    requestToken += 1;
    aiOperation.value = {
      ...operation,
      status: 'error',
      result: undefined,
      error: options.t('editor.aiOperation.sourceChanged'),
      canRetry: false,
    };
  }

  function clearOperation(): void {
    const operation = aiOperation.value;
    const view = activeOperationView;

    requestToken += 1;
    aiOperation.value = null;
    activeOperationView = null;

    if (operation && view) {
      const anchor = getEditorAiOperationAnchor(view.state);
      if (anchor?.operationId === operation.id) {
        clearEditorAiOperationAnchor(view);
      }
    }
  }

  async function requestAiOperation(operationId: number): Promise<void> {
    const operation = aiOperation.value;
    const view = activeOperationView;
    if (!operation || operation.id !== operationId || !view) {
      return;
    }

    const currentRequestToken = ++requestToken;

    try {
      const result = await aiService.generate({
        promptPreset: operation.promptPreset,
        messages: [
          { role: 'user', content: operation.sourceText },
        ],
      });

      const currentOperation = aiOperation.value;
      if (
        currentRequestToken !== requestToken
        || !currentOperation
        || currentOperation.id !== operationId
        || activeOperationView !== view
      ) {
        return;
      }

      if (!hasValidSource(currentOperation, view)) {
        if (options.activeNoteId() !== currentOperation.noteId || options.editorView() !== view) {
          clearOperation();
        } else {
          showSourceChangedError(currentOperation);
        }
        return;
      }

      if (result.success && result.answer?.trim()) {
        aiOperation.value = {
          ...currentOperation,
          status: 'preview',
          result: result.answer,
          error: undefined,
          canRetry: false,
        };
        return;
      }

      aiOperation.value = {
        ...currentOperation,
        status: 'error',
        result: undefined,
        error: result.error || options.t('editor.aiOperation.emptyResult'),
        canRetry: true,
      };
      logger.error('AI operation failed:', { error: result.error ?? 'Empty response' });
    } catch (error: unknown) {
      const currentOperation = aiOperation.value;
      if (
        currentRequestToken !== requestToken
        || !currentOperation
        || currentOperation.id !== operationId
      ) {
        return;
      }

      const errorMessage = getErrorMessage(error);
      aiOperation.value = {
        ...currentOperation,
        status: 'error',
        result: undefined,
        error: errorMessage || options.t('editor.aiOperation.requestFailed'),
        canRetry: hasValidSource(currentOperation, view),
      };
      logger.error(`AI operation error: ${errorMessage}`);
    }
  }

  function startAiOperation(action: EditorAiAction): void {
    if (aiOperation.value) {
      return;
    }

    const view = options.editorView();
    const noteId = options.activeNoteId();
    if (!view || !noteId) {
      return;
    }

    const selection = view.state.selection.main;
    const sourceText = view.state.doc.sliceString(selection.from, selection.to);
    if (!sourceText) {
      return;
    }

    const operationId = nextOperationId++;
    const config = AI_OPERATION_CONFIG[action];
    setEditorAiOperationAnchor(view, {
      operationId,
      from: selection.from,
      to: selection.to,
      sourceText,
    });

    activeOperationView = view;
    aiOperation.value = {
      id: operationId,
      status: 'pending',
      action,
      actionLabelKey: config.labelKey,
      promptPreset: config.promptPreset,
      noteId,
      sourceText,
      canRetry: false,
    };

    void requestAiOperation(operationId);
  }

  function applyAiOperation(): void {
    const operation = aiOperation.value;
    const view = activeOperationView;
    if (!operation || operation.status !== 'preview' || !operation.result || !view) {
      return;
    }

    if (!hasValidSource(operation, view)) {
      showSourceChangedError(operation);
      return;
    }

    const anchor = getEditorAiOperationAnchor(view.state);
    if (!anchor) {
      showSourceChangedError(operation);
      return;
    }

    const cursorPosition = anchor.from + operation.result.length;
    view.dispatch({
      changes: { from: anchor.from, to: anchor.to, insert: operation.result },
      selection: { anchor: cursorPosition, head: cursorPosition },
      scrollIntoView: true,
    });
    view.focus();
    clearOperation();
  }

  function discardAiOperation(): void {
    clearOperation();
  }

  function retryAiOperation(): void {
    const operation = aiOperation.value;
    const view = activeOperationView;
    if (!operation || operation.status !== 'error' || !operation.canRetry || !view) {
      return;
    }

    if (!hasValidSource(operation, view)) {
      showSourceChangedError(operation);
      return;
    }

    aiOperation.value = {
      ...operation,
      status: 'pending',
      result: undefined,
      error: undefined,
      canRetry: false,
    };
    void requestAiOperation(operation.id);
  }

  function syncAiOperationState(): void {
    const operation = aiOperation.value;
    const view = activeOperationView;
    if (!operation || !view || operation.status === 'error' && !operation.canRetry) {
      return;
    }

    const anchor = getEditorAiOperationAnchor(view.state);
    if (anchor?.operationId === operation.id && !anchor.valid) {
      showSourceChangedError(operation);
    }
  }

  function runAction(action: EditorContextAction): void {
    const view = options.editorView();
    if (!view || !action) {
      return;
    }

    const basicActions: EditorContextAction[] = [
      EDITOR_CONSTANTS.ACTIONS.CUT,
      EDITOR_CONSTANTS.ACTIONS.COPY,
      EDITOR_CONSTANTS.ACTIONS.PASTE,
      EDITOR_CONSTANTS.ACTIONS.DELETE,
      EDITOR_CONSTANTS.ACTIONS.SELECT_ALL,
    ];

    if (basicActions.includes(action)) {
      executeEditorAction(action, view);
      return;
    }

    if (isEditorAiAction(action)) {
      startAiOperation(action);
    }
  }

  async function openContextMenu(): Promise<void> {
    const view = options.editorView();
    const action = await showNativeEditorContextMenu(
      options.t,
      getEditorContextMenu(
        options.aiAssistantEnabled(),
        checkHasSelection(view),
        hasActiveAiOperation.value,
      ),
    );

    if (action) {
      runAction(action);
    }
  }

  return {
    aiOperation,
    hasActiveAiOperation,
    openContextMenu,
    applyAiOperation,
    discardAiOperation,
    retryAiOperation,
    syncAiOperationState,
  };
}
