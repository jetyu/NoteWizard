import { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { EDITOR_CHANGE_ORIGIN } from '@renderer/core/editor/createCodeEditor';
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

interface TestEditorView {
  state: EditorState;
}

function createEditorView(documentText = '这是一段可以继续补全的正文'): TestEditorView {
  return {
    state: EditorState.create({
      doc: documentText,
      selection: { anchor: documentText.length },
    }),
  };
}

function asEditorView(view: TestEditorView): EditorView {
  return view as EditorView;
}

function replaceDocument(view: TestEditorView, documentText: string, cursor = documentText.length): void {
  view.state = EditorState.create({
    doc: documentText,
    selection: { anchor: cursor },
  });
}

function createAssistant(view: TestEditorView, hint?: string) {
  const assistant = useAiAssistant();
  assistant.setDocumentContext({
    noteId: 'note-1',
    noteTitle: '测试笔记',
    suggestionHint: hint,
  });
  assistant.setEditorView(asEditorView(view));
  assistant.setEnabled(true);
  return assistant;
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

  it('requests a position-aware prediction after eligible typing', async () => {
    const view = createEditorView();
    const assistant = createAssistant(view);

    assistant.handleDocumentChange(asEditorView(view), enabledConfig, EDITOR_CHANGE_ORIGIN.TYPING);
    await vi.advanceTimersByTimeAsync(1500);

    expect(generateCompletionMock).toHaveBeenCalledOnce();
    expect(generateCompletionMock).toHaveBeenCalledWith({
      context: '这是一段可以继续补全的正文',
      contextAfter: undefined,
      noteTitle: '测试笔记',
      sectionHeading: undefined,
      intent: 'continue-sentence',
    });
    expect(completionMocks.showAiSuggestion).toHaveBeenCalledWith(asEditorView(view), '后续内容');
  });

  it('does not request a prediction when auto-continue is disabled', async () => {
    const view = createEditorView();
    const assistant = createAssistant(view);

    assistant.setEnabled(false);
    assistant.handleDocumentChange(asEditorView(view), {
      aiAssistant: {
        ...enabledConfig.aiAssistant,
        autoContinue: false,
      },
    }, EDITOR_CHANGE_ORIGIN.TYPING);
    await vi.advanceTimersByTimeAsync(5000);

    expect(generateCompletionMock).not.toHaveBeenCalled();
  });

  it('invalidates an in-flight result and reschedules from the latest typed content', async () => {
    const resolvers: Array<(result: { success: boolean; answer?: string }) => void> = [];
    generateCompletionMock.mockImplementation(() => new Promise((resolve) => {
      resolvers.push(resolve);
    }));

    const view = createEditorView('李白，');
    const assistant = createAssistant(view);
    assistant.handleDocumentChange(asEditorView(view), enabledConfig, EDITOR_CHANGE_ORIGIN.TYPING);
    await vi.advanceTimersByTimeAsync(1500);

    replaceDocument(view, '李白，中国著名诗人');
    assistant.handleDocumentChange(asEditorView(view), enabledConfig, EDITOR_CHANGE_ORIGIN.TYPING);
    resolvers[0]?.({ success: true, answer: '李白，中国著名诗人，以浪漫主义诗歌闻名' });
    await Promise.resolve();
    expect(completionMocks.showAiSuggestion).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1500);
    expect(generateCompletionMock).toHaveBeenCalledTimes(2);
    resolvers[1]?.({ success: true, answer: '，被誉为“诗仙”' });
    await Promise.resolve();
    await Promise.resolve();

    expect(completionMocks.showAiSuggestion).toHaveBeenCalledWith(asEditorView(view), '，被誉为“诗仙”');
  });

  it('invalidates scheduled work when the cursor or selection changes', async () => {
    const view = createEditorView();
    const assistant = createAssistant(view);
    assistant.handleDocumentChange(asEditorView(view), enabledConfig, EDITOR_CHANGE_ORIGIN.TYPING);

    assistant.handleSelectionChange();
    await vi.advanceTimersByTimeAsync(5000);

    expect(generateCompletionMock).not.toHaveBeenCalled();
    expect(completionMocks.clearAiSuggestion).toHaveBeenCalledWith(asEditorView(view));
  });

  it('prevents a previous note result from appearing after a note switch', async () => {
    let resolveCompletion: ((result: { success: boolean; answer?: string }) => void) | null = null;
    generateCompletionMock.mockReturnValue(new Promise((resolve) => {
      resolveCompletion = resolve;
    }));

    const view = createEditorView();
    const assistant = createAssistant(view);
    assistant.handleDocumentChange(asEditorView(view), enabledConfig, EDITOR_CHANGE_ORIGIN.TYPING);
    await vi.advanceTimersByTimeAsync(1500);

    assistant.setDocumentContext({ noteId: 'note-2', noteTitle: '另一篇笔记' });
    resolveCompletion?.({ success: true, answer: '不应显示的旧笔记建议' });
    await Promise.resolve();
    await Promise.resolve();

    expect(completionMocks.showAiSuggestion).not.toHaveBeenCalled();
  });

  it('filters paste, history, formatting, external, partial acceptance, and other changes', async () => {
    const view = createEditorView();
    const assistant = createAssistant(view);
    const ignoredOrigins = [
      EDITOR_CHANGE_ORIGIN.PASTE,
      EDITOR_CHANGE_ORIGIN.HISTORY,
      EDITOR_CHANGE_ORIGIN.FORMAT,
      EDITOR_CHANGE_ORIGIN.EXTERNAL,
      EDITOR_CHANGE_ORIGIN.AI_PARTIAL_ACCEPT,
      EDITOR_CHANGE_ORIGIN.OTHER,
    ];

    for (const origin of ignoredOrigins) {
      assistant.handleDocumentChange(asEditorView(view), enabledConfig, origin);
    }
    await vi.advanceTimersByTimeAsync(5000);

    expect(generateCompletionMock).not.toHaveBeenCalled();
  });

  it('uses an adaptive delay after complete acceptance', async () => {
    const view = createEditorView();
    const assistant = createAssistant(view);

    assistant.handleDocumentChange(asEditorView(view), enabledConfig, EDITOR_CHANGE_ORIGIN.AI_COMPLETE_ACCEPT);
    await vi.advanceTimersByTimeAsync(899);
    expect(generateCompletionMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(generateCompletionMock).toHaveBeenCalledOnce();
  });

  it('replaces a pending follow-up with ordinary timing when the user keeps typing', async () => {
    const view = createEditorView('李白，中国著名诗人');
    const assistant = createAssistant(view);
    assistant.handleDocumentChange(asEditorView(view), enabledConfig, EDITOR_CHANGE_ORIGIN.AI_COMPLETE_ACCEPT);
    await vi.advanceTimersByTimeAsync(500);

    replaceDocument(view, '李白，中国著名诗人，作品众多');
    assistant.handleDocumentChange(asEditorView(view), enabledConfig, EDITOR_CHANGE_ORIGIN.TYPING);
    await vi.advanceTimersByTimeAsync(400);
    expect(generateCompletionMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1100);
    expect(generateCompletionMock).toHaveBeenCalledOnce();
  });

  it('shows the localized shortcut hint only with the first suggestion', async () => {
    const view = createEditorView('李白，中国著名诗人');
    const assistant = createAssistant(view, '快捷键提示');
    assistant.handleDocumentChange(asEditorView(view), enabledConfig, EDITOR_CHANGE_ORIGIN.TYPING);
    await vi.advanceTimersByTimeAsync(1500);

    expect(completionMocks.showAiSuggestion).toHaveBeenLastCalledWith(
      asEditorView(view),
      '后续内容',
      '快捷键提示',
    );

    replaceDocument(view, '李白，中国著名诗人，作品众多');
    assistant.handleDocumentChange(asEditorView(view), enabledConfig, EDITOR_CHANGE_ORIGIN.TYPING);
    await vi.advanceTimersByTimeAsync(1500);

    expect(completionMocks.showAiSuggestion).toHaveBeenLastCalledWith(asEditorView(view), '后续内容');
  });

  it('clears scheduled and in-flight prediction work when disabled', async () => {
    let resolveCompletion: ((result: { success: boolean; answer?: string }) => void) | null = null;
    generateCompletionMock.mockReturnValue(new Promise((resolve) => {
      resolveCompletion = resolve;
    }));

    const view = createEditorView();
    const assistant = createAssistant(view);
    assistant.handleDocumentChange(asEditorView(view), enabledConfig, EDITOR_CHANGE_ORIGIN.TYPING);

    await vi.advanceTimersByTimeAsync(1500);
    expect(assistant.state.value.isProcessing).toBe(true);

    assistant.setEnabled(false);
    expect(assistant.state.value.isProcessing).toBe(false);
    expect(completionMocks.clearAiSuggestion).toHaveBeenCalledWith(asEditorView(view));

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
