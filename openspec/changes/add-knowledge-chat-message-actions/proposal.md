## Why

Knowledge Assistant conversations currently provide no per-message copy or correction actions, and a submitted question cannot be stopped while retrieval or answer generation is running. Users need predictable controls for correcting, retrying, copying, and cancelling ordinary question-answer turns without duplicating conversation history or accidentally replaying agent writes.

## What Changes

- Add copy actions for user messages and non-empty assistant responses.
- Let users edit and resend the latest settled ordinary question from the composer, replacing that turn in place.
- Let users regenerate a successful answer or retry a failed/stopped latest ordinary question.
- Replace the composer send control with a stop control immediately after ordinary-question or agent-task submission and cancel the matching request across Renderer, Preload, and Main.
- Persist failed and stopped generation state so retry remains available after reopening a conversation.
- Keep completed agent-task messages copy-only to avoid replaying note writes; stopping an active task does not roll back writes already executed.

## Capabilities

### New Capabilities

- `knowledge-chat-message-actions`: Defines copy, edit, regenerate/retry, and stop behavior for Knowledge Assistant messages.

### Modified Capabilities

None.

## Impact

- Knowledge Assistant renderer UI, composables, service orchestration, and workbench conversation persistence.
- Electron bridge, preload API, centralized IPC channels, and Knowledge Copilot main-process streaming handler.
- Knowledge Copilot QA streaming result/event types and Simplified Chinese UI strings.
- No new dependencies and no breaking migration; new persisted fields remain optional for existing conversation data.
