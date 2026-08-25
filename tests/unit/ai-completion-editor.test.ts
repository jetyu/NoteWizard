import { EditorState, type Transaction, type TransactionSpec } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import {
  EDITOR_CHANGE_ORIGIN,
  classifyEditorChange,
} from '@renderer/core/editor/createCodeEditor';
import {
  acceptNextSentenceSuggestion,
  acceptNextWordSuggestion,
  acceptSuggestion,
  acceptedSuggestionAnnotation,
  aiCompletionPlugin,
  getCurrentSuggestion,
  getCurrentSuggestionHint,
  showAiSuggestion,
} from '@renderer/core/ai/wordsAutoCompletion';

interface TestEditorView {
  view: EditorView;
  getLastTransaction: () => Transaction | null;
}

function createTestEditorView(documentText = 'Start'): TestEditorView {
  let state = EditorState.create({
    doc: documentText,
    selection: { anchor: documentText.length },
    extensions: [aiCompletionPlugin],
  });
  let lastTransaction: Transaction | null = null;
  const view = {
    get state() {
      return state;
    },
    dispatch(spec: TransactionSpec) {
      const transaction = state.update(spec);
      lastTransaction = transaction;
      state = transaction.state;
    },
  } as EditorView;

  return {
    view,
    getLastTransaction: () => lastTransaction,
  };
}

describe('AI completion editor controls', () => {
  it('classifies typing, paste, history, and formatting transactions', () => {
    const state = EditorState.create({ doc: 'Start' });
    const createTransaction = (userEvent: string) => state.update({
      changes: { from: state.doc.length, insert: 'x' },
      userEvent,
    });

    expect(classifyEditorChange([createTransaction('input.type')])).toBe(EDITOR_CHANGE_ORIGIN.TYPING);
    expect(classifyEditorChange([createTransaction('input.paste')])).toBe(EDITOR_CHANGE_ORIGIN.PASTE);
    expect(classifyEditorChange([createTransaction('undo')])).toBe(EDITOR_CHANGE_ORIGIN.HISTORY);
    expect(classifyEditorChange([createTransaction('input.format')])).toBe(EDITOR_CHANGE_ORIGIN.FORMAT);
  });

  it('stores the localized hint with the visible suggestion', () => {
    const { view } = createTestEditorView();

    showAiSuggestion(view, ' continuation', 'Tab 接受全部');

    expect(getCurrentSuggestion(view.state)).toBe(' continuation');
    expect(getCurrentSuggestionHint(view.state)).toBe('Tab 接受全部');
  });

  it('accepts the next word and preserves the remaining suggestion', () => {
    const { view, getLastTransaction } = createTestEditorView();
    showAiSuggestion(view, ' continues naturally. Another sentence.');

    expect(acceptNextWordSuggestion(view)).toBe(true);

    expect(view.state.doc.toString()).toBe('Start continues');
    expect(getCurrentSuggestion(view.state)).toBe(' naturally. Another sentence.');
    expect(getLastTransaction()?.annotation(acceptedSuggestionAnnotation)).toBe('partial');
  });

  it('accepts the next sentence and preserves later sentences', () => {
    const { view, getLastTransaction } = createTestEditorView();
    showAiSuggestion(view, ' First sentence. Second sentence.');

    expect(acceptNextSentenceSuggestion(view)).toBe(true);

    expect(view.state.doc.toString()).toBe('Start First sentence. ');
    expect(getCurrentSuggestion(view.state)).toBe('Second sentence.');
    expect(getLastTransaction()?.annotation(acceptedSuggestionAnnotation)).toBe('partial');
  });

  it('accepts all remaining text and marks completion', () => {
    const { view, getLastTransaction } = createTestEditorView();
    showAiSuggestion(view, ' complete continuation');

    expect(acceptSuggestion(view)).toBe(true);

    expect(view.state.doc.toString()).toBe('Start complete continuation');
    expect(getCurrentSuggestion(view.state)).toBeNull();
    expect(getLastTransaction()?.annotation(acceptedSuggestionAnnotation)).toBe('complete');
  });

  it('preserves default key handling semantics when no suggestion exists', () => {
    const { view } = createTestEditorView();

    expect(acceptNextWordSuggestion(view)).toBe(false);
    expect(acceptNextSentenceSuggestion(view)).toBe(false);
    expect(acceptSuggestion(view)).toBe(false);
  });

  it('clears a visible suggestion when the selection moves', () => {
    const { view } = createTestEditorView();
    showAiSuggestion(view, ' continuation');

    view.dispatch({ selection: { anchor: 0 } });

    expect(getCurrentSuggestion(view.state)).toBeNull();
  });
});
