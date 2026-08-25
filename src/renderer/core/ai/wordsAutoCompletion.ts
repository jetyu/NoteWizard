import { EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { StateField, StateEffect, EditorState, Annotation, Prec } from '@codemirror/state';
import { keymap } from '@codemirror/view';

interface AiSuggestionValue {
  text: string;
  hint?: string;
}

export type AiSuggestionAcceptance = 'partial' | 'complete';

// 定义补全建议的状态效果
const setSuggestion = StateEffect.define<AiSuggestionValue | null>();

// 定义标记：表示这是接受AI建议的操作
export const acceptedSuggestionAnnotation = Annotation.define<AiSuggestionAcceptance>();

// 记录最近一次建议被清除（无论是被接受、拒绝还是用户打字覆盖）的时间戳
let lastSuggestionClearTime = 0;

export function getLastSuggestionClearTime(): number {
  return lastSuggestionClearTime;
}

// 补全建议的状态字段
const suggestionState = StateField.define<AiSuggestionValue | null>({
  create: () => null,
  update(value, tr) {
    let nextValue = value;
    let hasSuggestionEffect = false;
    for (const effect of tr.effects) {
      if (effect.is(setSuggestion)) {
        nextValue = effect.value;
        hasSuggestionEffect = true;
      }
    }

    // 内容或选择变化时清除旧建议；部分接受会通过 effect 显式保留剩余文本。
    if ((tr.docChanged || tr.selection) && nextValue !== null && !hasSuggestionEffect) {
      nextValue = null;
    }

    if (value !== null && nextValue === null) {
      lastSuggestionClearTime = Date.now();
    }

    return nextValue;
  },
});

// Ghost text widget - 显示灰色的补全建议
class SuggestionWidget extends WidgetType {
  constructor(readonly suggestion: AiSuggestionValue) {
    super();
  }

  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-ai-suggestion';
    span.append(document.createTextNode(this.suggestion.text));
    if (this.suggestion.hint) {
      const hint = document.createElement('span');
      hint.className = 'cm-ai-suggestion-hint';
      hint.textContent = this.suggestion.hint;
      span.append(hint);
    }
    return span;
  }

  eq(other: SuggestionWidget) {
    return this.suggestion.text === other.suggestion.text
      && this.suggestion.hint === other.suggestion.hint;
  }

  ignoreEvent() {
    return true;
  }
}

const suggestionDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.state.field(suggestionState) !== update.startState.field(suggestionState)) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const suggestion = view.state.field(suggestionState);
      if (!suggestion) {
        return Decoration.none;
      }

      const pos = view.state.selection.main.head;
      const widget = Decoration.widget({
        widget: new SuggestionWidget(suggestion),
        side: 1,
      });

      return Decoration.set([widget.range(pos)]);
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

function acceptSuggestionRange(view: EditorView, acceptedLength: number): boolean {
  const suggestion = view.state.field(suggestionState);
  if (!suggestion) {
    return false;
  }

  const acceptedText = suggestion.text.slice(0, acceptedLength);
  if (!acceptedText) {
    return false;
  }

  const remainingText = suggestion.text.slice(acceptedText.length);
  const pos = view.state.selection.main.head;
  view.dispatch({
    changes: { from: pos, insert: acceptedText },
    selection: { anchor: pos + acceptedText.length },
    effects: setSuggestion.of(remainingText
      ? { ...suggestion, text: remainingText }
      : null),
    annotations: [acceptedSuggestionAnnotation.of(remainingText ? 'partial' : 'complete')],
  });

  return true;
}

function fallbackWordLength(text: string): number {
  const match = text.match(/^[\s\p{P}\p{S}]*(?:[\p{L}\p{N}_]+|[\u3400-\u9fff])/u);
  return match?.[0].length ?? Array.from(text)[0]?.length ?? 0;
}

function nextWordLength(text: string): number {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
  let end = 0;
  for (const segment of segmenter.segment(text)) {
    end = segment.index + segment.segment.length;
    if (segment.isWordLike) {
      return end;
    }
  }
  return end || fallbackWordLength(text);
}

function nextSentenceLength(text: string): number {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' });
  const firstSegment = segmenter.segment(text)[Symbol.iterator]().next();
  if (!firstSegment.done) {
    return firstSegment.value.segment.length;
  }

  const fallback = text.match(/^.*?[。！？.!?]+[”’"'）】]?/u);
  return fallback?.[0].length ?? text.length;
}

export function acceptSuggestion(view: EditorView): boolean {
  const suggestion = view.state.field(suggestionState);
  return suggestion ? acceptSuggestionRange(view, suggestion.text.length) : false;
}

export function acceptNextWordSuggestion(view: EditorView): boolean {
  const suggestion = view.state.field(suggestionState);
  return suggestion ? acceptSuggestionRange(view, nextWordLength(suggestion.text)) : false;
}

export function acceptNextSentenceSuggestion(view: EditorView): boolean {
  const suggestion = view.state.field(suggestionState);
  return suggestion ? acceptSuggestionRange(view, nextSentenceLength(suggestion.text)) : false;
}

function rejectSuggestion(view: EditorView): boolean {
  const suggestion = view.state.field(suggestionState);
  if (!suggestion) {
    return false;
  }

  view.dispatch({
    effects: setSuggestion.of(null),
  });

  return true;
}

const suggestionKeymap = Prec.highest(keymap.of([
  {
    key: 'Ctrl-Shift-ArrowRight',
    run: acceptNextSentenceSuggestion,
  },
  {
    key: 'Ctrl-ArrowRight',
    run: acceptNextWordSuggestion,
  },
  {
    key: 'Tab',
    run: acceptSuggestion,
  },
  {
    key: 'Escape',
    run: rejectSuggestion,
  },
]));

export function showAiSuggestion(view: EditorView, suggestion: string, hint?: string) {
  if (!suggestion) return;

  view.dispatch({
    effects: setSuggestion.of({ text: suggestion, hint }),
  });
}

export function clearAiSuggestion(view: EditorView) {
  view.dispatch({
    effects: setSuggestion.of(null),
  });
}

export function getCurrentSuggestion(state: EditorState): string | null {
  return state.field(suggestionState, false)?.text || null;
}

export function getCurrentSuggestionHint(state: EditorState): string | null {
  return state.field(suggestionState, false)?.hint || null;
}

export function hasSuggestion(state: EditorState): boolean {
  return getCurrentSuggestion(state) !== null;
}

export const aiCompletionPlugin = [
  suggestionState,
  suggestionDecorations,
  suggestionKeymap,
  EditorView.baseTheme({
    '.cm-ai-suggestion': {
      fontStyle: 'italic',
    },
  }),
];
