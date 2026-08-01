## Context

AI sources persist a provider identity, editable base URL, API key, model, and capability list. Azure OpenAI's GA v1 API and Fireworks AI's inference API expose the endpoint shapes already used by Snaptium, so the providers can be added without new IPC contracts, configuration fields, or dependencies.

Azure endpoints are resource-specific, while Fireworks has a stable public base URL. Fireworks also returns reranking results in the `data` array shape already accepted by the remote AI service.

## Goals / Non-Goals

**Goals:**

- Offer Azure OpenAI and Fireworks AI as recognizable, selectable providers.
- Support Azure chat and embeddings through the OpenAI-compatible v1 API.
- Support Fireworks chat, embeddings, and reranking through its shared inference base URL.
- Preserve existing AI source persistence and smart-writing/Knowledge Copilot orchestration.

**Non-Goals:**

- Anthropic Claude, OpenCode, DeepInfra, Together AI, or other providers.
- Microsoft Entra ID authentication, legacy dated Azure API versions, or Azure-specific model discovery.
- Fireworks model catalog discovery or automatic per-model capability detection.
- Changes to the existing no-model empty-state behavior.

## Decisions

### Reuse the OpenAI-compatible v1 adapters

Azure OpenAI and Fireworks AI are included in the existing OpenAI-compatible provider predicate. Chat and embedding construction continues to use `ChatOpenAI` and `OpenAIEmbeddings`, and smart writing continues to call the configured `/chat/completions` endpoint.

Provider-specific SDKs were rejected because they would add dependencies without enabling behavior required by this change.

### Keep Azure's base URL user-supplied

Azure receives an empty default base URL and provider-specific placeholders that show the required `https://<resource>.openai.azure.com/openai/v1` shape. The model field represents the Azure deployment name. Provider inference recognizes OpenAI-compatible v1 paths on both `*.openai.azure.com` and `*.services.ai.azure.com`.

A fake resource URL is not inserted as an editable value because it would look configured while remaining unusable.

### Advertise capabilities at the provider level

Azure advertises chat and embedding. Fireworks advertises chat, embedding, and reranking, consistent with the existing capability selector behavior. A saved source still represents one configured model, so users can narrow the selected capabilities to those supported by that model.

### Generalize the existing reranker adapter

The private SiliconFlow-named document compressor is renamed to describe its OpenAI-compatible rerank request shape. Fireworks is added to the explicit reranker allowlist; no unrelated provider capability declarations are changed.

### Bundle presentation assets locally

Azure and Fireworks labels use Simplified Chinese locale entries and local SVG assets through the existing renderer presentation registry. No runtime image requests are introduced.

## Risks / Trade-offs

- [Azure resource URLs vary by account] → Keep the endpoint editable and provide a provider-specific example rather than a hard-coded URL.
- [A Fireworks model may not implement every advertised provider capability] → Preserve the existing capability checkboxes so the user can select the model's actual role.
- [Provider APIs can evolve] → Retain the generic OpenAI-compatible provider as a fallback and keep all preset endpoints editable.

## Migration Plan

No data migration is required. Existing source records remain valid, and records without a valid provider identity can infer the new providers from recognized endpoints. Rollback consists of removing the two selector entries and adapter allowlist additions; existing unrelated providers remain unchanged.

## Open Questions

None.
