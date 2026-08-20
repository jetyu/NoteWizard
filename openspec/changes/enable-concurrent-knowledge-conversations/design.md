## Context

`SearchView` currently owns one set of mutable generation fields (`isBusy`, active request flags, generating question ID, streaming answer, sources, stage, and errors). The Ask and Agent composables also each retain only one active request ID. Although Main already stores active requests in maps keyed by request ID, the Renderer overwrites its single active request whenever another run starts. New-conversation creation is therefore disabled globally, and simply removing that disabled condition would let `resetAnswer()` erase the old run's UI state and cancellation identity.

Concurrent completion also exposes a persistence race: separate requests can finish close together and independently rebuild the workbench conversation arrays before saving settings. The implementation must merge each result into the latest store state so one conversation cannot overwrite another conversation's result.

## Goals / Non-Goals

**Goals:**

- Allow one active generation per conversation and multiple active generations across different conversations.
- Support both ordinary Ask requests and Agent tasks, including resumed Agent actions.
- Keep progress, partial output, sources, errors, and cancellation identity attached to the originating question and conversation.
- Make new-conversation creation, conversation navigation, and the active conversation's composer independent of background runs.
- Prevent concurrent persistence from losing turns or terminal results.

**Non-Goals:**

- Continuing requests after the application window closes, reloads, or the app exits.
- Running more than one request at the same time inside a single conversation.
- Adding a global task center, desktop notifications, provider-side queues, or configurable concurrency limits.
- Rolling back Agent writes that completed before a stop request.
- Resolving semantic conflicts when two auto-mode Agent tasks intentionally update the same note; existing write behavior remains authoritative.

## Decisions

1. Replace global generation fields with a conversation-scoped run registry. Each run record is keyed by thread ID and contains a stable request ID, question ID, mode, lifecycle state, stop flag, stage, partial answer, sources, fallback state, and error. The question ID remains the rendering key, while the thread ID enforces the one-active-run-per-conversation rule.

   A global queue was rejected because it would still prevent the user from immediately working in another conversation. Creating a separate `SearchView` instance per conversation was rejected because conversation selection is already modeled inside one view and would duplicate view-level state.

2. Make the renderer request APIs request-addressable rather than singleton-active. Ask and Agent orchestration SHALL accept or return a stable request ID and cancellation SHALL require that request ID. Completion cleanup removes only the matching registry entry. Main's existing owner-scoped request maps and request-ID-filtered stream events are retained because they already support multiple requests from the same window.

3. Scope composer behavior to the active conversation. The new-conversation control and history navigation never depend on runs in other threads. The composer shows Stop only when the active thread owns a run; otherwise it shows Send and can start a request even if background threads are busy. Mode/model changes are disabled only for an active run in the current thread.

4. Keep background callbacks detached from current selection. Stream deltas and terminal results update their run/question by captured IDs. They do not assign `activeThreadId`, replace the current `selectedQuestion`, clear the active composer's text, scroll an unrelated thread, or steal focus. Navigating back derives the generating display from the registry and shows the accumulated partial content.

5. Persist runs with merge-safe store mutations. Workbench writes for recording a draft, replacing a completed question, updating a summary, and updating Agent metadata are serialized through a store-local mutation chain (or an equivalent latest-state transaction). Every mutation recomputes from the latest settings state when it executes. A failed persistence operation must not permanently break later queued mutations.

6. Keep same-conversation ordering strict. A thread with an active Ask, Agent, or Agent-resume run cannot submit, edit, regenerate, retry, approve, or reject another turn until that run settles or is stopped. Different threads remain independent.

7. Preserve existing Agent write semantics. Agent runs in different conversations may execute concurrently according to their configured confirmation/auto modes. Stop remains request-scoped and does not roll back completed writes. This change does not claim to detect semantic conflicts between two agents editing the same note.

## Risks / Trade-offs

- [Risk] Several simultaneous model calls may hit provider rate limits sooner. → Keep failures isolated to their originating conversation and do not cancel other runs; provider-specific errors remain visible on the affected turn.
- [Risk] A stale callback could update a replacement run. → Compare both request ID and question ID before accepting deltas or terminal cleanup.
- [Risk] Concurrent settings saves could lose another conversation's update. → Serialize workbench mutations and rebuild each payload from the latest state at execution time.
- [Risk] Background completion could disrupt the active conversation. → Guard all focus, selection, scrolling, and composer mutations by the originating thread ID.
- [Risk] Multiple auto-mode Agent tasks can make logically conflicting note edits. → Retain current write semantics and surface executed-write records; semantic merge/conflict resolution remains out of scope.
- [Risk] Run state grows while several conversations are active. → Remove settled registry entries after their terminal state is persisted; persisted messages provide the long-lived display state.

## Migration Plan

No persisted schema migration is required. Introduce the request-addressable renderer APIs and run registry, then switch `SearchView` computed state and handlers to the registry. Existing optional question generation fields remain unchanged. Rollback consists of reverting the renderer concurrency changes; Main request maps and current persisted conversations remain compatible.

## Open Questions

None. The initial implementation intentionally has no artificial cross-conversation concurrency limit; provider limits are handled as per-request failures.
