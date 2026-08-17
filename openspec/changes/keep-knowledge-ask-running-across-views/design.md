## Context

`MainLayout` conditionally mounts one main view at a time. Switching away from Search therefore destroys `SearchView`, while its in-flight Ask promise and IPC invocation may still continue. The component-local request ID, generating question ID, streaming buffer, source list, and stage indicators are lost. A new `SearchView` instance restores the persisted draft question before the old request completes and renders it as an empty result.

## Goals / Non-Goals

**Goals:**

- Keep an in-flight Ask request and its renderer-side stream state alive across main-view navigation.
- Show the same generating state or completed answer when the user returns.
- Avoid leaving Search-specific document and resize listeners active while the cached view is hidden.
- Preserve existing conversation persistence and IPC behavior.

**Non-Goals:**

- Continuing requests after the application window closes or reloads.
- Adding request queues, cancellation controls, notifications, or parallel Ask execution.
- Changing main-process retrieval or answer generation.

## Decisions

- Cache only `SearchView` with Vue `KeepAlive`. This retains the existing component-local orchestration and streaming callbacks without moving a large amount of UI state into a new global store.
- Keep other main views on their current conditional mounting behavior to minimize memory and lifecycle changes.
- Treat deactivation separately from unmounting. Deactivation removes document- and window-level UI listeners and ends pane resizing, but it does not clear the pending Ask dispatch or generation state. Activation restores listeners and refreshes rendering/scroll position.
- Retain full unmount cleanup for application teardown.

An alternative was to move all active Ask state into Pinia. That would provide process-wide task management but requires a broader redesign of stream stages, sources, draft persistence, error state, and conversation selection. Caching the existing view directly addresses the navigation lifecycle bug with lower regression risk.

## Risks / Trade-offs

- [Risk] The cached Search view consumes memory while inactive. → Cache only this single view; its existing history limits already bound retained conversation data.
- [Risk] Global event listeners could react while the view is hidden. → Register them on mount/activation and remove them on deactivation/unmount with idempotent helpers.
- [Risk] Markdown enhancement work may target an inactive DOM tree. → Invalidate pending enhancement runs on deactivation and resynchronize after activation.
