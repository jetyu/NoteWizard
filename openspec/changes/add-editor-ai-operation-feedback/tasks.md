## 1. Editor Operation State

- [x] 1.1 Add a CodeMirror state extension that tracks, maps, decorates, invalidates, and clears the source selection for an AI operation
- [x] 1.2 Refactor the editor context-menu composable to expose typed pending, preview, and error states with safe apply, discard, and retry actions
- [x] 1.3 Disable smart-writing menu actions while one editor AI operation is active
- [x] 1.4 Suspend automatic writing completion while an editor AI operation is active and restore it when the operation closes

## 2. Contextual Feedback UI

- [x] 2.1 Add a selection-adjacent floating card for progress, generated preview, confirmation, and retryable errors
- [x] 2.2 Position the card from the mapped CodeMirror selection and dock it inside the editor when the source is offscreen
- [x] 2.3 Add Simplified Chinese translations and accessible progress/error semantics

## 3. Verification

- [x] 3.1 Add unit coverage for source-range mapping and invalidation behavior
- [x] 3.2 Run OpenSpec validation, unit tests, renderer type checking, lint, and diff checks
- [x] 3.3 Add suspension coverage and rerun the relevant verification commands
