## Why

The title-bar quick note search currently forgets every query after navigation, so users must repeatedly retype useful searches. A compact, locally persisted history makes repeated note lookup faster while keeping query data on the current device.

## What Changes

- Record a quick-search query only when the user opens a note from its results.
- Show the 10 most recent unique queries in the existing title-bar dropdown when the focused input is empty.
- Let users rerun a historical query, delete one entry, or clear all entries without confirmation.
- Persist history locally across application restarts without including it in settings export, import, or sync.
- Preserve the existing debounced result search, note navigation, and keyboard interaction while extending them to history entries.

## Capabilities

### New Capabilities

- `quick-search-history`: Defines recording, persistence, display, reuse, and deletion behavior for title-bar quick-search history.

### Modified Capabilities

None.

## Impact

- Affects the Renderer search feature and title-bar quick-search component.
- Adds Simplified Chinese labels for the history dropdown actions.
- Adds no Electron IPC, preload bridge, main-process service, dependency, or settings-schema changes.
