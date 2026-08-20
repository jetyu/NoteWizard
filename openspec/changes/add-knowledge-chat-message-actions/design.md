## Context

Knowledge Assistant question answering is orchestrated in the Renderer, exposed through the Preload bridge, and executed as a streamed request in Main. The current flow creates a draft conversation entry and later overwrites it by regenerating the same derived ID, but it has no generic in-place update operation, no durable error state, and no cancellation channel. Agent tasks share the conversation UI but can execute note writes, so replay controls must not be exposed for those turns.

## Goals / Non-Goals

**Goals:**

- Provide discoverable copy, edit, regenerate/retry, and stop controls for ordinary question-answer turns.
- Stop the active question immediately in the UI and propagate cancellation to Main and supported model calls.
- Replace the latest settled ordinary turn without duplicating it or including its old answer in regenerated context.
- Persist failed/stopped state without breaking existing settings data.

**Non-Goals:**

- Replaying or editing completed agent tasks.
- Deleting individual turns or collecting answer ratings.
- Rolling back any note writes.
- Changing the existing AI source selection or provider error-classification rules.

## Decisions

1. The composer submit button becomes the stop button synchronously when a normal question or agent task is accepted. Renderer-side cancellation flags handle the small interval before an IPC request ID is active; after activation, cancellation invokes the matching question or task cancellation channel.
2. Main stores active question requests by request ID together with their owning WebContents ID and AbortController. Only the owner can cancel a request, and entries are removed in `finally` to prevent leaks.
3. The QA service accepts an AbortSignal, passes it to LangChain chat invocations/streams, and checks it between preparation, rewrite, retrieval, assessment, and generation phases. The Renderer stops accepting deltas immediately even if a lower-level retrieval operation cannot abort until its current phase returns.
4. Stopping is a non-error terminal result. Any partial answer is persisted with `stopped` state; an empty stopped turn renders a localized stopped message and remains retryable.
5. Editing uses the existing bottom composer. The UI records the target question ID, shows an editing indicator, and replaces the latest settled ordinary turn after submission. The store preserves the stable question ID/askedAt while updating query, result fields, answeredAt, and thread updatedAt in both recent questions and conversation threads.
6. Regeneration and edited resend build conversation context from turns before the target. The current selected ask model is used because historical model identity is not stored.
7. Clipboard writes use `navigator.clipboard` with the existing editor bridge fallback. Copies use raw question text or raw Markdown, not rendered HTML.
8. Agent cancellation passes AbortSignal into LangGraph invocation and checkpoints surrounding summary/model work. Any executed-write metadata returned before cancellation is preserved when available, but completed writes are never rolled back.

## Risks / Trade-offs

- Some embedding or reranking operations may not accept AbortSignal → stop Renderer updates immediately and enforce cancellation checkpoints before and after each phase.
- A cancellation may race with normal completion → make cancel idempotent and treat a missing/finished request as a successful no-op.
- Optional persisted fields must remain compatible with old settings → sanitize unknown values and infer legacy completed display from existing answer content without rewriting stored data.
- Existing unrelated working-tree changes overlap Knowledge Copilot error handling → make surgical edits and preserve the current provider-aware error changes.
