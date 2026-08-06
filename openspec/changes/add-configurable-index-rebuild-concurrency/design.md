## Context

Knowledge Copilot rebuild orchestration currently runs in the Renderer store and uses a constant concurrency of three for changed notes. Embedding providers have different capacity limits: user-managed providers can reasonably opt into more parallel work, while the built-in Snaptium AI service should remain capped at the existing concurrency to protect shared capacity. Settings are normalized in both Renderer and Main, and source selection is represented by an AI source whose provider identifies Snaptium AI.

## Goals / Non-Goals

**Goals:**

- Persist a user-selected rebuild concurrency from 1 through 6 with a default of 3.
- Present the value as a numeric dropdown in Index Settings.
- Dynamically restrict the available and effective concurrency to 3 for Snaptium AI embeddings.
- Keep stale or manually edited settings from bypassing runtime limits.
- Keep vector-store table creation and mutations safe when concurrent embedding work completes together.

**Non-Goals:**

- Redesign embedding batching or add a new batch rebuild IPC.
- Change chunk size, chunk overlap, or retrieval behavior.
- Automatically benchmark a provider or infer its rate limit.

## Decisions

### Persist the requested concurrency in Knowledge Copilot settings

Add `rebuildConcurrency` beside the existing index construction settings. A numeric setting keeps the behavior explicit, and the existing settings persistence path avoids a new IPC surface. The default remains 3 so upgrades preserve current runtime behavior.

An enum such as slow/balanced/fast was considered, but it hides the actual execution parameter from users already working in the advanced Index Settings page.

### Use a constrained numeric dropdown

The dropdown exposes integer values rather than accepting arbitrary numeric input. Non-Snaptium sources expose 1 through 6; Snaptium AI exposes 1 through 3. This prevents invalid or unexpectedly large concurrency while remaining more transparent than qualitative presets.

### Clamp both configuration and execution

Renderer and Main settings normalization clamp persisted values to the global 1-through-6 range. When an embedding source is selected or loaded, provider-aware logic clamps Snaptium AI values to 3. The rebuild scheduler independently resolves the effective value from the current source and applies the same cap before creating workers.

This defense-in-depth approach keeps direct configuration edits and older persisted values from exceeding the provider limit.

### Apply changes to subsequent rebuilds

The rebuild operation reads and resolves concurrency once when scheduling its work. Updating the dropdown affects the next rebuild and does not resize a worker pool that is already active, avoiding mid-operation scheduling complexity.

### Serialize vector-store mutations, not embedding requests

Embedding generation remains concurrent because it dominates rebuild time. LanceDB table creation, additions, deletions, and clears pass through a small in-process mutation queue so a full rebuild cannot race while creating the first table. This preserves most of the speed gain while keeping the mutable table reference consistent.

## Risks / Trade-offs

- [Higher concurrency can trigger external provider rate limits] → Cap the supported value at 6 and explain the resource/rate-limit trade-off in the UI.
- [Switching to Snaptium AI can leave an out-of-range persisted value] → Clamp and persist the value during source updates and enforce the cap again at runtime.
- [More concurrent embedding completions can race during initial table creation] → Serialize vector-store mutations while leaving embedding requests concurrent.

## Migration Plan

Existing settings without `rebuildConcurrency` normalize to 3. Rollback can ignore the additional setting because older builds normalize known fields independently.

## Open Questions

None.
