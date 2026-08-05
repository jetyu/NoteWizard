## Why

Snaptium currently requires users to understand providers, endpoints, API keys, capabilities, and model names before any AI feature can work. A built-in free source should make AI Assistant and Knowledge Copilot usable with one consistent selection while preserving custom providers for users who need them.

## What Changes

- Add one locked, non-editable built-in AI source card with the invariant shared-constant name `Snaptium AI`; the same card title is reused directly by every source selector.
- Route the single built-in source to three stable model aliases according to the requested capability: `snaptium-chat`, `snaptium-embedding`, and `snaptium-reranker`.
- Keep the public endpoint and three aliases in shared constants, and fetch the public NEW API token from `https://snaptium.com/key.txt` in Main with validation, coalescing, and a process-lifetime memory cache; refresh and retry once only after an authentication rejection, and never expose that token through Renderer state, settings persistence, config export, UI, or logs.
- Automatically preselect the built-in source for all compatible roles when an installation has no user-managed AI configuration, without enabling AI feature switches or overriding existing user selections.
- Require a one-time privacy confirmation before the first request that sends text or notes to the built-in service.
- Keep built-in initialization and consent markers device-local: persist them in local settings, omit them from portable configuration exports, and retain the receiving device's markers during import.
- Report quota, expiry, rate-limit, and availability failures explicitly and guide users to a custom AI source without silently switching providers or disabling features.
- Keep user-managed OpenAI-compatible and Ollama sources fully supported alongside the built-in source.

## Capabilities

### New Capabilities

- `built-in-free-ai-service`: Defines the built-in source presentation, capability-specific model routing, default selection, consent, failure behavior, and public-token boundary.

### Modified Capabilities

None.

## Impact

- Shared provider constants and Main AI credential/provider services.
- Main settings normalization and persisted consent state.
- Renderer AI source, AI Assistant, and Knowledge Copilot settings presentation.
- Simplified Chinese locale copy and existing Electron/Vue type contracts.
- Unit coverage for canonical built-in source normalization, default selection, routing, consent, and failure handling.
- NEW API operations must restrict the shared token to the three aliases and apply finite quota, expiry, group rate limits, monitoring, and a rotation/revocation procedure.
