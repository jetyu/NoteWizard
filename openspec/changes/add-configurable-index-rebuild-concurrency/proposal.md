## Why

Knowledge Copilot index rebuilds currently use a fixed concurrency of three, so users cannot trade indexing speed for provider limits or local resource usage. The index settings page should expose this execution parameter while protecting the built-in Snaptium AI service from excessive concurrency.

## What Changes

- Add a persisted numeric index rebuild concurrency setting with a default value of 3.
- Add a constrained numeric dropdown to Index Settings instead of a free-form input.
- Allow concurrency values from 1 through 6 for non-Snaptium embedding sources.
- Limit Snaptium AI embedding sources to concurrency values from 1 through 3, including when switching sources or loading existing settings.
- Apply a runtime concurrency cap when scheduling index rebuild work so stale configuration cannot bypass provider limits.

## Capabilities

### New Capabilities

- `knowledge-copilot-index-rebuild`: Configurable and provider-aware concurrency controls for Knowledge Copilot index rebuilds.

### Modified Capabilities

None.

## Impact

- Renderer and Main settings types, defaults, and normalization.
- Knowledge Copilot rebuild orchestration in the Renderer store.
- Knowledge Copilot Index Settings UI and Simplified Chinese locale strings.
- No new dependencies or IPC channels.
