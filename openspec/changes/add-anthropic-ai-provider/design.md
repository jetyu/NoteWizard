## Context

AI sources are identified in shared constants, presented by the renderer registry, and instantiated in the main-process provider factory. Anthropic uses its own Messages API and authentication conventions, so treating Claude as a generic OpenAI-compatible provider would make compatibility and Tool Calling behavior less reliable.

## Goals / Non-Goals

**Goals:**

- Add a first-class Anthropic provider that can be selected, saved, restored, and inferred from its API hostname.
- Instantiate Claude through the native LangChain `ChatAnthropic` adapter.
- Reuse the existing connection and Tool Calling validation flows.
- Keep the provider model user-entered and capabilities limited to Chat.

**Non-Goals:**

- Adding Anthropic embedding or reranking capabilities.
- Adding model discovery, provider-specific model presets, or Anthropic server tools.
- Changing existing providers or AI source persistence formats.

## Decisions

- Add `anthropic` to the shared provider identity with default endpoint `https://api.anthropic.com` and capability `chat`. This keeps capability selection declarative and prevents Claude from appearing in embedding or reranking workflows.
- Use `@langchain/anthropic` rather than the OpenAI compatibility adapter. The native adapter exposes LangChain's common chat model and Tool Calling interfaces while preserving Anthropic protocol behavior.
- Pass the configured base URL to the Anthropic client so the existing editable endpoint field remains meaningful.
- Reuse the existing AI source selection, persistence, connection test, and Tool Calling validation paths. Their provider schema and capability dispatch already derive from the shared registry.
- Add a local SVG asset and a Simplified Chinese locale key through the existing renderer presentation registry.

## Risks / Trade-offs

- [Risk] A new provider package increases dependency and bundle size. → Pin a version compatible with the current `@langchain/core` and import only its chat adapter.
- [Risk] Custom Anthropic-compatible gateways may differ from the official API. → Default to the official endpoint while leaving the existing base URL field editable.
- [Risk] A user may select an embedding-only workflow with Anthropic. → Declare only Chat capability so the existing role selectors exclude Anthropic from unsupported roles.
