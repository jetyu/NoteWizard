## Context

`AppTitleBarSearch.vue` owns the current quick-search input, its debounced note lookup, dropdown visibility, highlighted result, and note navigation. Quick-search history is UI-scoped state: it does not require filesystem access, application settings, or cross-device synchronization. The stored JSON is an untrusted browser-storage boundary and must be narrowed before use.

## Goals / Non-Goals

**Goals:**

- Keep a local, most-recent-first list of up to 10 successful quick-search queries.
- Extend the current dropdown and keyboard model without changing note-search semantics.
- Isolate persistence and normalization from the Vue component and degrade safely when storage is unavailable.

**Non-Goals:**

- Synchronizing or exporting search history.
- Recording AI knowledge-search questions, note IDs, result contents, or timestamps.
- Adding settings, IPC, preload, main-process, or dependency changes.

## Decisions

1. Store history under a versioned Renderer `localStorage` key. This keeps query data on the current device and avoids coupling low-value UI history to the settings export/import path. A dedicated search-feature service will expose typed `list`, `record`, `remove`, and `clear` operations and keep an in-memory copy so storage failures do not break the current session.
2. Treat parsed storage as `unknown`, accept only trimmed non-empty strings, remove exact duplicates while preserving newest-first order, and cap the list at 10. Recording an existing query promotes the latest spelling-identical entry rather than creating a duplicate.
3. Record only after the user selects a note result. Debounced lookups and historical-query reuse do not record by themselves, preventing temporary input fragments from polluting history.
4. Reuse the existing dropdown. Empty focused input displays history; non-empty input displays note results. The same highlighted index and Up/Down/Enter/Escape handling applies to whichever list is active. Deletion buttons stop propagation, and clearing the input exposes history again while focus remains.
5. Rerunning history performs an immediate note search rather than waiting for another edit. Search responses are applied only when their captured query still matches the current trimmed input, preventing an older request from replacing newer results.
6. Add only the required Simplified Chinese labels and reuse the existing generic delete label, following repository localization policy.

## Risks / Trade-offs

- Browser storage may be unavailable or corrupted → Catch access/parse/write failures, sanitize all values, log without including query content, and continue with in-memory history.
- A local-only history is not recovered by settings import → This is intentional to limit propagation of potentially sensitive query text.
- A mixed history/results dropdown could complicate navigation → Display only one list at a time and reset or clamp the highlighted index whenever its contents change.
