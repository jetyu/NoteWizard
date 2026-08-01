## Context

AI sources persist a provider identity, endpoint, API key, model, and enabled capabilities. The generic OpenAI-compatible option already supports several requested services, but it requires users to discover and enter the correct endpoint themselves.

## Goals / Non-Goals

### Goals

- Offer Alibaba Cloud Model Studio, Volcengine, Kimi, Zhipu AI, and Grok as distinct provider presets.
- Supply each preset's documented OpenAI-compatible endpoint and chat capability.
- Reuse the existing OpenAI-compatible LangChain adapter and local logo presentation pattern.
- Infer the provider identity for sources that use the known endpoints.

### Non-Goals

- Model catalog discovery, model defaults, or automatic credential provisioning.
- Embedding or reranking support for the new presets.
- Provider regions, domestic/international groups, or additional provider-specific adapters.

## Decisions

### Use provider identities with a shared compatible adapter

Each service receives a separate `AiProvider` value, endpoint, and chat-only capability set. The main process treats those values as OpenAI-compatible and creates `ChatOpenAI` with the selected source endpoint.

This keeps saved sources recognizable and lets the settings UI display the appropriate name and logo. Keeping every service under the generic option was rejected because it loses both of those benefits.

### Keep endpoints editable

The preset endpoint is only the initial value. Users may replace it for a workspace-specific, regional, or future endpoint without changing the provider identity.

### Bundle local presentation assets

The renderer references local SVG assets through the existing provider-presentation configuration. This avoids network loading in the settings UI and uses the same presentation mechanism as current providers.

## Risks / Trade-offs

- Provider APIs and region-specific endpoints may change. Editable endpoints and the generic compatible fallback preserve an escape hatch.
- Grok documentation favors the Responses API for new integrations, while this application currently uses the Chat Completions adapter. The preset is chat-only and retains the editable endpoint so users can select a compatible model or use the generic provider when needed.

## Migration Plan

No explicit data migration or legacy provider alias is included. Sources using recognized Alibaba Cloud Model Studio or Volcengine endpoints are identified from their URLs during normalization; sources that retain the former `qwen` or `doubao` value with an unrecognized custom endpoint fall back to the generic OpenAI-compatible provider.
