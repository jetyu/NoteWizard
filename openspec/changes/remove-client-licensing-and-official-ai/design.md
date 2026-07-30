## Context

The desktop client currently treats AI source configuration, AI writing, Knowledge Copilot, external knowledge sources, and sync as paid features. License state crosses Main, Preload, and Renderer, while built-in official AI sources depend on license tokens and are injected into every settings load. There are no production paid users to migrate, and the product direction is now a fully open client using user-managed AI providers.

## Goals / Non-Goals

**Goals:**

- Remove every runtime license gate and all client activation infrastructure.
- Remove official AI sources and make custom OpenAI-compatible/Ollama sources the only AI path.
- Preserve valid custom provider configuration during upgrades and imports.
- Leave AI-dependent features in a clear unconfigured state when their legacy official source disappears.
- Remove obsolete cross-layer public APIs instead of leaving always-allowed compatibility shims.

**Non-Goals:**

- Decommissioning external license or official AI backend deployments.
- Deleting old license files from user data directories.
- Rewriting historical changelogs or removing the Apache 2.0 repository license.
- Automatically selecting or creating a user AI provider.

## Decisions

1. **Delete license infrastructure instead of forcing a permanent free state.** An always-free license model would retain state, network requests, IPC, UI, and future ambiguity without providing value.
2. **Delete official AI integration together with licensing.** Official sources cannot operate safely without authentication and quota enforcement. Keeping them as unavailable cards would preserve the same onboarding and maintenance burden.
3. **Normalize legacy settings at the Main settings boundary.** Main remains the source of truth for persisted and imported configuration. Legacy official source IDs are filtered, custom sources are preserved, and dependent enabled states are disabled only when their required source is no longer valid.
4. **Do not silently choose replacement providers.** Provider selection can affect cost, privacy, model behavior, and embedding compatibility. Users must explicitly select a custom source.
5. **Remove public IPC and bridge contracts.** No compatibility stubs are retained because they would expose a misleading API and no external renderer consumers are supported.
6. **Leave old local license files untouched.** The new client stops reading and writing them. Automatic deletion would add destructive migration behavior solely to remove inert files.

## Risks / Trade-offs

- [Existing users configured with official sources lose AI configuration] → Clear only legacy selections, disable affected features, and preserve all custom sources.
- [Knowledge indexes may have been created with the removed official embedding model] → Disable Knowledge Copilot when its embedding source is removed so reconfiguration is explicit before future indexing.
- [Removing broad cross-layer APIs causes compile failures] → Delete from Main through Preload and Renderer in one change and run all layer-specific builds.
- [External product copy may still advertise paid plans] → Record backend and website retirement as a coordinated release action outside this repository.

## Migration Plan

1. Ship settings normalization before feature use during application startup.
2. Filter the three legacy official source IDs from saved and imported source arrays.
3. Clear selections that reference those IDs; disable AI Assistant or Knowledge Copilot when a required source is absent.
4. Remove license initialization and all entitlement checks.
5. Remove official source definitions and all client-facing activation surfaces.
6. Rollback, if needed, requires reinstalling the previous release; untouched local license files remain available to that version.

## Open Questions

None.
