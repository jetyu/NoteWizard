## Why

Azure OpenAI users currently have to configure the service as a generic OpenAI-compatible source, while users who need chat, embedding, and reranking models do not have a first-class Fireworks AI preset. Dedicated presets make both services discoverable and ensure their advertised capabilities match the existing AI source workflows.

## What Changes

- Add Azure OpenAI as a selectable provider with chat and embedding capabilities through the GA OpenAI-compatible v1 API.
- Add Fireworks AI as a selectable provider with chat, embedding, and reranking capabilities.
- Add provider-specific endpoint defaults or hints, endpoint inference, Simplified Chinese labels, and local brand icons.
- Route both providers through the existing OpenAI-compatible adapters and allow Fireworks AI to use the existing reranking request shape.
- Keep the current conditional empty-state message for smart writing and Knowledge Copilot when no compatible AI source exists.

## Capabilities

### New Capabilities

- `azure-fireworks-ai-providers`: First-class Azure OpenAI and Fireworks AI source presets, capabilities, presentation, endpoint inference, and model construction.

### Modified Capabilities

- None.

## Impact

- Updates shared AI provider constants and the `AiProvider` union.
- Updates main-process provider model construction and reranker selection without changing IPC or persisted source fields.
- Updates the renderer provider selector, local assets, and Simplified Chinese locale entries.
- Adds focused unit coverage for provider capabilities and endpoint inference.
