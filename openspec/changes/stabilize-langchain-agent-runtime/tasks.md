## 1. Align Agent runtime contracts

- [x] 1.1 Update the localized Agent prompts to reference the registered write tools and describe confirm-mode HITL behavior accurately.
- [x] 1.2 Preserve Agent business state and the original write mode across in-process HITL resumes, then clean runtime state and checkpoints on terminal outcomes.
- [x] 1.3 Replace the ineffective closure counter with LangChain's thread-scoped tool-call-limit middleware and remove the unused failure-limit result state.

## 2. Make note writes safe and truthful

- [x] 2.1 Return truncation metadata from `readNote` and reject full replacement of notes longer than the Agent read limit.
- [x] 2.2 Record successful workspace mutations before index maintenance and return index failures as separate warnings for create, update, rename, move, trash, and restore.
- [x] 2.3 Add the required Simplified Chinese runtime messages through the existing i18n system.

## 3. Complete resumed-result handling

- [x] 3.1 Centralize resumed Agent result application in the Renderer and persist the final answer, sources, summary, status, and cumulative Agent metadata to the original question.
- [x] 3.2 Refresh the workspace after resumed writes and avoid duplicating cumulative trace events or executed-write records across repeated interrupts.

## 4. Verify the change

- [x] 4.1 Add focused tests for prompt/tool contracts, HITL state continuity, tool-call limits, truncation protection, partial-success indexing, and resumed-result merging where the existing test harness supports them.
- [x] 4.2 Run strict OpenSpec validation and the smallest relevant unit tests.
- [x] 4.3 Run `npm run build:main`, `npm run typecheck`, and the relevant lint command; resolve regressions introduced by this change.
