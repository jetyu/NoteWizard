## Why

Knowledge Ask execution state currently lives inside `SearchView`, which is destroyed whenever the user switches to another main view. Returning before the request finishes loses the visible generating state and shows the unanswered draft as an empty-result message, making a still-running request appear interrupted.

## What Changes

- Preserve the Knowledge Assistant view instance while users navigate between main views.
- Allow an in-flight Ask request to keep receiving stages and streamed answer content while the view is inactive.
- Restore the same conversation, generating indicator, and completed answer when the user returns.
- Keep document- and window-level UI listeners active only while the cached view is visible.

## Capabilities

### New Capabilities

- `knowledge-ask-view-continuity`: Preserve in-flight Knowledge Ask execution and UI state across main-view navigation.

### Modified Capabilities

None.

## Impact

- Affects the application main-view mounting strategy and the Knowledge Assistant activation lifecycle.
- Does not change IPC contracts, persisted conversation formats, or main-process Ask execution.
