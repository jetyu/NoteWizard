## 1. Cancellation Boundary

- [x] 1.1 Add validated cancel IPC, preload/bridge types, and owner-scoped Main request tracking
- [x] 1.2 Propagate AbortSignal through ordinary QA model calls and represent cancellation as a non-error result
- [x] 1.3 Expose active request cancellation from the renderer service and chat composable
- [x] 1.4 Add owner-scoped Agent task cancellation through Renderer, Preload, Main, and LangGraph

## 2. Conversation State

- [x] 2.1 Add sanitized failed/stopped generation state and error fields to persisted workbench questions
- [x] 2.2 Add an in-place question replacement operation that updates recent questions and conversation threads
- [x] 2.3 Refactor ordinary question execution to support edit, regenerate, retry, partial-stop persistence, and context exclusion

## 3. Message Actions UI

- [x] 3.1 Add copy controls with clipboard fallback and transient copied feedback
- [x] 3.2 Add latest-turn edit-in-composer and regenerate/retry actions while keeping completed agent tasks copy-only
- [x] 3.3 Switch the composer send control to stop immediately after Ask or Agent submission and add localized stopped/edit/action labels

## 4. Verification

- [x] 4.1 Add focused tests for persisted terminal state, Ask/Agent cancellation, and provider-specific error regression
- [x] 4.2 Run OpenSpec validation, relevant unit tests, typecheck, Main build, Preload build, and lint
