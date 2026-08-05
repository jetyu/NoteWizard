## Context

The desktop client currently treats AI source configuration, AI writing, Knowledge Copilot, external knowledge sources, and sync as paid features. License state crosses Main, Preload, and Renderer, while built-in official AI sources depend on license tokens and are injected into every settings load. There are no production paid users to migrate, and the product direction is now a fully open client using user-managed AI providers.

## Goals / Non-Goals

**Goals:**

- Remove every runtime license gate and all client activation infrastructure.
- Remove official AI sources and make custom OpenAI-compatible/Ollama sources the only AI path.
- Preserve valid custom provider configuration during settings saves and imports.
- Keep feature enablement independent from provider selection while leaving unconfigured operations unavailable.
- Remove obsolete cross-layer public APIs instead of leaving always-allowed compatibility shims.

**Non-Goals:**

- Decommissioning external license or official AI backend deployments.
- Deleting old license files from user data directories.
- Rewriting historical changelogs or removing the Apache 2.0 repository license.
- Automatically selecting or creating a user AI provider.

## Decisions

1. **Delete license infrastructure instead of forcing a permanent free state.** An always-free license model would retain state, network requests, IPC, UI, and future ambiguity without providing value.
2. **Delete official AI integration together with licensing.** Official sources cannot operate safely without authentication and quota enforcement. Keeping them as unavailable cards would preserve the same onboarding and maintenance burden.
3. **Normalize current settings at the Main settings boundary.** Main remains the source of truth for persisted and imported configuration. Invalid source selections are cleared, valid custom sources are preserved, and normalization does not override feature enablement.
4. **Do not silently choose replacement providers.** Provider selection can affect cost, privacy, model behavior, and embedding compatibility. Users must explicitly select a custom source.
5. **Remove public IPC and bridge contracts.** No compatibility stubs are retained because they would expose a misleading API and no external renderer consumers are supported.
6. **Leave old local license files untouched.** The new client stops reading and writing them. Automatic deletion would add destructive migration behavior solely to remove inert files.
7. **Allow provider selection while AI features are disabled.** Source selectors depend only on compatible configured sources, so feature switches and provider setup do not lock each other.

## Risks / Trade-offs

- [Removing broad cross-layer APIs causes compile failures] → Delete from Main through Preload and Renderer in one change and run all layer-specific builds.
- [External product copy may still advertise paid plans] → Record backend and website retirement as a coordinated release action outside this repository.

## Implementation Plan

1. Remove license initialization and all entitlement checks.
2. Remove official source definitions and all client-facing activation surfaces.
3. Keep custom source normalization at existing settings boundaries without any official-source compatibility branch.
4. Preserve AI feature switches when a compatible source has not yet been selected.
5. Keep source selectors available whenever at least one compatible custom source exists.

## Open Questions

None.
