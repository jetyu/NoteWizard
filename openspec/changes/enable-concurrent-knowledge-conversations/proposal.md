## Why

Knowledge Assistant currently treats all generation as one global busy operation, so an in-flight Ask or Agent response disables new-conversation creation and prevents the user from starting work in another conversation. Users need conversation-scoped generation so they can leave one response running in the background and continue working independently elsewhere.

## What Changes

- Keep the new-conversation control and conversation navigation available while other conversations are generating.
- Allow multiple conversations to run Ask and/or Agent requests concurrently within the Knowledge Assistant view.
- Track streaming output, progress, errors, sources, and stop state by request and conversation instead of in global single-request fields.
- Show send/stop controls according to the active conversation only; stopping one conversation must not cancel another conversation's request.
- Persist each completed, failed, or stopped result back to its originating conversation without switching the user's active conversation or stealing composer focus.
- Prevent conflicting operations within the same conversation while allowing independent conversations to proceed concurrently.

## Capabilities

### New Capabilities

- `knowledge-conversation-concurrency`: Defines conversation-scoped concurrent Ask and Agent generation, navigation, stopping, and result ownership.

### Modified Capabilities

None.

## Impact

- Knowledge Assistant renderer state and UI orchestration, including `SearchView` and Knowledge Copilot composables.
- Request identity and cancellation handling across the Renderer, Preload bridge, and Main process may require extension so multiple active requests owned by the same window remain independently addressable.
- Workbench conversation persistence and tests for concurrent completion, cancellation isolation, and active-thread UI behavior.
- No new dependencies and no persisted-data migration are expected.
