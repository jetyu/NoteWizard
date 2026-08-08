import {
  EditorState,
  StateEffect,
  StateField,
  type Extension,
  type Transaction,
} from '@codemirror/state';
import { Decoration, EditorView, type DecorationSet } from '@codemirror/view';

export interface EditorAiOperationAnchor {
  operationId: number;
  from: number;
  to: number;
  sourceText: string;
  valid: boolean;
}

export interface EditorAiOperationAnchorInput {
  operationId: number;
  from: number;
  to: number;
  sourceText: string;
}

export const setEditorAiOperationAnchorEffect =
  StateEffect.define<EditorAiOperationAnchorInput | null>();

function mapAnchor(
  anchor: EditorAiOperationAnchor,
  transaction: Transaction,
): EditorAiOperationAnchor {
  let overlapsSource = false;

  transaction.changes.iterChangedRanges((fromA, toA) => {
    if (fromA === toA) {
      overlapsSource ||= fromA > anchor.from && fromA < anchor.to;
      return;
    }

    overlapsSource ||= fromA < anchor.to && toA > anchor.from;
  });

  return {
    ...anchor,
    from: transaction.changes.mapPos(anchor.from, 1),
    to: transaction.changes.mapPos(anchor.to, -1),
    valid: anchor.valid && !overlapsSource,
  };
}

export const editorAiOperationAnchorState = StateField.define<EditorAiOperationAnchor | null>({
  create: () => null,
  update(value, transaction) {
    let nextValue = value && transaction.docChanged
      ? mapAnchor(value, transaction)
      : value;

    for (const effect of transaction.effects) {
      if (effect.is(setEditorAiOperationAnchorEffect)) {
        nextValue = effect.value
          ? { ...effect.value, valid: true }
          : null;
      }
    }

    return nextValue;
  },
  provide: (field) => EditorView.decorations.from(field, (anchor): DecorationSet => {
    if (!anchor?.valid || anchor.from === anchor.to) {
      return Decoration.none;
    }

    return Decoration.set([
      Decoration.mark({ class: 'cm-ai-operation-source' }).range(anchor.from, anchor.to),
    ]);
  }),
});

export const editorAiOperationExtension: Extension = [
  editorAiOperationAnchorState,
  EditorView.baseTheme({
    '.cm-ai-operation-source': {
      backgroundColor: 'color-mix(in srgb, var(--accent) 14%, transparent)',
      borderBottom: '1px solid color-mix(in srgb, var(--accent) 65%, transparent)',
      borderRadius: '2px',
    },
  }),
];

export function setEditorAiOperationAnchor(
  view: EditorView,
  anchor: EditorAiOperationAnchorInput,
): void {
  view.dispatch({
    effects: setEditorAiOperationAnchorEffect.of(anchor),
  });
}

export function clearEditorAiOperationAnchor(view: EditorView): void {
  view.dispatch({
    effects: setEditorAiOperationAnchorEffect.of(null),
  });
}

export function getEditorAiOperationAnchor(state: EditorState): EditorAiOperationAnchor | null {
  return state.field(editorAiOperationAnchorState, false) ?? null;
}
