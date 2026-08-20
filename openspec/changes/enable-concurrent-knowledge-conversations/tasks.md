## 1. Request-Scoped Execution

- [x] 1.1 Refactor the Ask composable to support multiple request IDs concurrently and cancel only an explicitly selected request
- [x] 1.2 Refactor Agent run/resume orchestration to support multiple request IDs concurrently and cancel only an explicitly selected request
- [x] 1.3 Add focused composable tests proving concurrent requests and cancellation isolation while retaining Main's owner-scoped request maps

## 2. Conversation-Scoped UI State

- [x] 2.1 Replace SearchView's global generation flags, streaming buffers, sources, stages, and errors with a thread/question/request run registry
- [x] 2.2 Keep New Conversation and history navigation available during background generation, and scope Send/Stop plus mode/model controls to the active thread
- [x] 2.3 Route Ask deltas and terminal results to captured originating IDs without changing an unrelated active thread, composer, scroll position, or focus
- [x] 2.4 Route Agent run and resume results, metadata, pending actions, and stopping through the same conversation-scoped ownership rules
- [x] 2.5 Prevent edit, regenerate, retry, delete, or a second submission only in the conversation that currently owns an active run

## 3. Merge-Safe Persistence

- [x] 3.1 Serialize workbench conversation mutations so each queued write recomputes from the latest state and a failed save does not block later mutations
- [x] 3.2 Add unit tests proving concurrent draft, terminal-result, summary, and Agent metadata updates preserve both conversations

## 4. Verification

- [x] 4.1 Add regression coverage for background completion, out-of-order settlement, foreground-only stopping, and failure isolation
- [x] 4.2 Run OpenSpec validation, relevant unit tests, typecheck, Main/Preload builds if touched, lint, and the production renderer build
