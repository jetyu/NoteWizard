## Context

The editor smart-writing flow is implemented in `useEditorContextMenu`. It reads the current selection, calls the existing non-streaming AI service, and replaces whichever selection is current when the response arrives. The native menu closes before generation begins, and errors are only logged. CodeMirror already supports state fields and decorations for inline AI completion, while `EditorPane` is the natural owner for selection-adjacent Vue UI.

## Goals / Non-Goals

**Goals:**

- Give immediate, action-specific feedback for rewrite, expand, simplify, and summarize.
- Keep generated text out of the document until the user confirms it.
- Apply a result only to the source range that initiated the request.
- Allow edits outside the source range while invalidating edits that overlap it.
- Keep errors and retry actions in the same contextual surface.

**Non-Goals:**

- Streaming generated tokens into the editor.
- Showing a determinate percentage for model generation.
- Cancelling the underlying network request.
- Supporting multiple simultaneous smart-writing operations in one editor.
- Changing AI prompts, providers, or IPC contracts.

## Decisions

### Track the source range in a CodeMirror state field

A renderer-core CodeMirror extension will store the active operation ID, source text, mapped `from`/`to` positions, and validity. Transactions before or after the source range map its positions. A transaction that overlaps the source range marks it invalid. The extension also decorates a valid source range while the operation is visible.

This is safer than retaining raw offsets in the composable and less disruptive than making the editor read-only during generation.

### Keep orchestration in the editor composable

`useEditorContextMenu` will own a typed `pending | preview | error` operation state and expose apply, discard, retry, and position-refresh helpers. It captures the note ID and CodeMirror view before calling the existing `aiService.generate` method. Late responses are ignored when their operation is no longer active.

Only one operation is allowed per editor. Smart-writing submenu entries remain visible but disabled while an operation card is open.

`EditorPane` will synchronously suspend the existing AI writing assistant whenever an operation becomes active. Suspension clears visible suggestions, cancels pending timers, invalidates in-flight completion responses, and prevents new completion scheduling. Closing or applying the operation removes the suspension without changing the user's saved auto-completion settings.

### Render a Vue floating card beside the source selection

`EditorPane` will render a dedicated card component using fixed viewport coordinates derived from `EditorView.coordsAtPos`. The card prefers the space below the source range, flips above when necessary, and clamps to the editor bounds. If the anchor is outside CodeMirror's rendered viewport, the card docks to the nearest editor edge.

The pending state contains an indeterminate spinner and localized action text. The preview state shows plain text in a scrollable region with Apply and Discard actions. The error state shows Retry and Close. No cancel control is shown while pending.

### Validate again immediately before applying

Apply succeeds only when the operation ID, note ID, editor view, mapped range, and source text still match. It dispatches a change against the mapped source range rather than the current selection. Invalid operations keep the document unchanged and transition to a localized source-changed error.

## Risks / Trade-offs

- **The network request continues after a note switch or local discard.** → Invalidate the local operation token and ignore the late result; true cancellation remains out of scope.
- **Long generated text can obscure the editor.** → Cap card width at 420 px and preview height at 260 px with internal scrolling.
- **Floating positioning can become stale during resize or scroll.** → Recalculate on card state changes, editor scroll, document changes, window resize, and editor-host resize.
- **Edits at source boundaries can be ambiguous.** → Treat boundary insertions as outside the source range and map the range inward; any change inside or replacing the range invalidates it.

## Migration Plan

No data or IPC migration is required. The renderer change can be rolled back by removing the new CodeMirror extension and restoring direct replacement in the context-menu composable.

## Open Questions

None.
