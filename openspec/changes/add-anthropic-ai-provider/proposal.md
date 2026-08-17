## Why

Snaptium supports several OpenAI-compatible chat providers but does not offer a native Anthropic configuration. Adding Anthropic lets users use Claude for Ask and tool-enabled knowledge workflows without routing it through an incompatible generic provider.

## What Changes

- Add Anthropic as a selectable AI provider with its official API endpoint and Chat-only capability.
- Create Claude chat models through the native LangChain Anthropic adapter.
- Include Anthropic in connection and Tool Calling validation through the existing AI source flow.
- Add a local Anthropic provider icon and Simplified Chinese provider label.

## Capabilities

### New Capabilities

- `anthropic-ai-provider`: Configure, persist, test, and use Anthropic Claude as a Chat-capable AI provider.

### Modified Capabilities

None.

## Impact

- Affects the shared provider registry, main-process model factory, and renderer provider presentation.
- Adds `@langchain/anthropic` and its Anthropic SDK dependency.
- Adds a local provider icon and a Simplified Chinese locale entry.
