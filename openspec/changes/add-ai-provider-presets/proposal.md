## Why

Users can connect additional mainstream model services through the generic OpenAI-compatible option, but must discover and enter each service's endpoint manually. Curated provider presets make the requested services easier to configure and identify without changing how AI sources are stored.

## What Changes

- Add Alibaba Cloud Model Studio, Volcengine, Kimi, Zhipu AI (GLM), and xAI Grok as selectable AI provider presets.
- Provide each preset with its supported default endpoint, chat capability, consistent color brand mark, and source-card presentation.
- Extend provider inference so existing sources using the new known endpoints receive the corresponding provider identity.
- **BREAKING**: Use platform provider identities for Alibaba Cloud Model Studio and Volcengine; the former `qwen` and `doubao` provider values are not retained as aliases.

## Capabilities

### New Capabilities

- `ai-provider-presets`: Curated OpenAI-compatible AI-source presets and presentation metadata for additional model services.

### Modified Capabilities

- None.

## Impact

- Updates shared AI provider constants, renderer provider presentation, and provider model construction.
- Adds local logo assets only; existing AI source persistence and IPC contracts remain unchanged.
