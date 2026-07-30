## Why

Snaptium's client-side license gates add onboarding friction and significant cross-layer complexity while the project is prioritizing open-source adoption. The application should offer every local capability without activation and rely exclusively on user-managed AI providers such as OpenAI-compatible APIs and Ollama.

## What Changes

- **BREAKING** Remove license activation, validation, device management, paid plans, offline grace, feature entitlements, and all associated client UI and IPC APIs.
- Make AI sources, AI writing, Knowledge Copilot, external knowledge sources, and WebDAV/S3 sync available without a license check.
- **BREAKING** Remove Snaptium official AI sources, models, token resolution, and official AI defaults.
- Default new installations to no AI source and require users to add their own provider before using AI-dependent features.
- Keep AI feature switches independent from source selection so users can configure providers before or after enabling a feature.
- Retain the repository's Apache 2.0 open-source license and historical changelog records.

## Capabilities

### New Capabilities

- `license-free-application`: Defines unrestricted application access and user-managed AI configuration without legacy license or official-AI contracts.

### Modified Capabilities

None.

## Impact

- Main process bootstrap, IPC registration, AI configuration, sync, Knowledge Copilot, settings normalization, and diagnostic export.
- Preload APIs and renderer bridge types.
- Renderer application shell, settings, search, and the complete license feature module.
- Persisted and imported AI configuration.
- The desktop client no longer consumes Snaptium license or official AI endpoints.
