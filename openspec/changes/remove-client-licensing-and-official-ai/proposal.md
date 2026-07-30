## Why

Snaptium's client-side license gates add onboarding friction and significant cross-layer complexity while the project is prioritizing open-source adoption. The application should offer every local capability without activation and rely exclusively on user-managed AI providers such as OpenAI-compatible APIs and Ollama.

## What Changes

- **BREAKING** Remove license activation, validation, device management, paid plans, offline grace, feature entitlements, and all associated client UI and IPC APIs.
- Make AI sources, AI writing, Knowledge Copilot, external knowledge sources, and WebDAV/S3 sync available without a license check.
- **BREAKING** Remove Snaptium official AI sources, models, token resolution, and official AI defaults.
- Default new installations to no AI source and require users to add their own provider before enabling AI-dependent features.
- Migrate existing settings by preserving custom sources while removing legacy official-source entries and invalid dependent selections.
- Retain the repository's Apache 2.0 open-source license and historical changelog records.

## Capabilities

### New Capabilities

- `license-free-application`: Defines unrestricted application access, user-managed AI configuration, and safe migration away from legacy license and official-AI settings.

### Modified Capabilities

None.

## Impact

- Main process bootstrap, IPC registration, AI configuration, sync, Knowledge Copilot, settings normalization, and diagnostic export.
- Preload APIs and renderer bridge types.
- Renderer application shell, settings, search, and the complete license feature module.
- Persisted settings created by prior releases and imported configuration packages.
- The desktop client no longer consumes Snaptium license or official AI endpoints.
