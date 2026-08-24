import { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { EDITOR_CONSTANTS } from '@renderer/features/editor/constants/editor.constants';
import { getEditorContextMenu } from '@renderer/features/editor/services/editorContextMenu.service';
import { useAiAssistant } from '@renderer/features/ai/composables/useAiAssistant';

const completionMocks = vi.hoisted(() => ({
  clearAiSuggestion: vi.fn(),
  getLastSuggestionClearTime: vi.fn(() => 0),
  hasSuggestion: vi.fn(() => false),
  showAiSuggestion: vi.fn(),
}));
const generateCompletionMock = vi.hoisted(() => vi.fn());
const loggerMock = vi.hoisted(() => ({
  debug: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
}));

vi.mock('@codemirror/language', () => ({
  syntaxTree: () => ({
    resolveInner: () => null,
  }),
}));

vi.mock('@renderer/core/ai/wordsAutoCompletion', () => completionMocks);

vi.mock('@renderer/features/ai/services/ai.service', () => ({
  aiService: {
    generateCompletion: generateCompletionMock,
  },
}));

vi.mock('@renderer/features/logger', () => ({
  createLogger: () => loggerMock,
  logger: loggerMock,
}));

const enabledConfig = {
  aiAssistant: {
    enabled: true,
    autoContinue: true,
    triggerMode: 'standard' as const,
  },
};

function createEditorView(documentText = '这是一段可以继续补全的正文'): EditorView {
  const state = EditorState.create({
    doc: documentText,
    selection: { anchor: documentText.length },
  });

  return { state } as EditorView;
}

describe('AI assistant auto-continue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-24T12:00:00Z'));
    vi.clearAllMocks();
    generateCompletionMock.mockResolvedValue({ success: true, answer: '后续内容' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('requests a prediction after eligible input when auto-continue is enabled', async () => {
    const editorView = createEditorView();
    const assistant = useAiAssistant();

    assistant.setEnabled(true);
    assistant.handleTyping(editorView, enabledConfig);
    await vi.advanceTimersByTimeAsync(1500);

    expect(generateCompletionMock).toHaveBeenCalledOnce();
    expect(generateCompletionMock).toHaveBeenCalledWith({
      context: '这是一段可以继续补全的正文',
    });
    expect(completionMocks.showAiSuggestion).toHaveBeenCalledWith(editorView, '后续内容');
  });

  it('does not request a prediction when auto-continue is disabled', async () => {
    const editorView = createEditorView();
    const assistant = useAiAssistant();

    assistant.setEnabled(false);
    assistant.handleTyping(editorView, {
      aiAssistant: {
        ...enabledConfig.aiAssistant,
        autoContinue: false,
      },
    });
    await vi.advanceTimersByTimeAsync(5000);

    expect(generateCompletionMock).not.toHaveBeenCalled();
  });

  it('clears scheduled and in-flight prediction work when disabled', async () => {
    let resolveCompletion: ((result: { success: boolean; answer?: string }) => void) | null = null;
    generateCompletionMock.mockReturnValue(new Promise((resolve) => {
      resolveCompletion = resolve;
    }));

    const editorView = createEditorView();
    const assistant = useAiAssistant();
    assistant.setEditorView(editorView);
    assistant.setEnabled(true);
    assistant.handleTyping(editorView, enabledConfig);

    await vi.advanceTimersByTimeAsync(1500);
    expect(assistant.state.value.isProcessing).toBe(true);

    assistant.setEnabled(false);
    expect(assistant.state.value.isProcessing).toBe(false);
    expect(completionMocks.clearAiSuggestion).toHaveBeenCalledWith(editorView);

    resolveCompletion?.({ success: true, answer: '不应显示的迟到建议' });
    await Promise.resolve();
    await Promise.resolve();

    expect(completionMocks.showAiSuggestion).not.toHaveBeenCalled();
  });
});

describe('Smart Writing context-menu independence', () => {
  it('keeps explicit AI operations available independently from auto-continue', () => {
    const enabledItems = getEditorContextMenu(true, true);
    const disabledItems = getEditorContextMenu(false, true);

    expect(enabledItems.some((item) => item.labelKey === EDITOR_CONSTANTS.MENU.AI_OPERATIONS)).toBe(true);
    expect(disabledItems.some((item) => item.labelKey === EDITOR_CONSTANTS.MENU.AI_OPERATIONS)).toBe(false);
  });
});
