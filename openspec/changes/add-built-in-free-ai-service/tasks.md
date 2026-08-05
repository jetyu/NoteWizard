## 1. Built-in Source Contract and Configuration

- [x] 1.1 Add the reserved built-in source ID, invariant `Snaptium AI` source-name constant, `snaptium` provider metadata, three-capability model map, and shared capability-model resolver without adding Snaptium to the user-created provider menu.
- [x] 1.2 Add the public endpoint and three stable aliases to shared constants, and fetch the administrator-supplied public token from the HTTPS static URL through a validated, coalesced, process-lifetime Main-only cache with one authentication-refresh retry.
- [x] 1.3 Add a Main built-in AI service that returns sanitized canonical source metadata separately from request credentials and endpoints.

## 2. Settings and Default Selection

- [x] 2.1 Extend Main and Renderer settings contracts with device-local built-in initialization/consent state and capability-specific source model metadata.
- [x] 2.2 Inject exactly one canonical virtual built-in source during Main normalization, reject forged reserved-ID records, strip the virtual source from persistence and exports, and omit device-local built-in state from portable exports while preserving it on import.
- [x] 2.3 Apply built-in source/model defaults once when no user-managed source exists, preserve feature switches and existing custom selections, and preserve later user-cleared optional roles.
- [x] 2.4 Prevent Renderer add, edit, and delete flows from mutating the reserved built-in source and update role selection logic to store the correct capability alias.

## 3. Request Routing, Consent, and Failure Handling

- [x] 3.1 Treat the Snaptium provider as OpenAI-compatible for chat and embeddings and support its `/rerank` path.
- [x] 3.2 Resolve every built-in request from shared constants and the remotely fetched token so chat uses `snaptium-chat`, embeddings use `snaptium-embedding`, and reranking uses `snaptium-reranker` regardless of Renderer or persisted values.
- [x] 3.3 Add a coalesced native first-use confirmation, persist the accepted consent version, and abort all declined operations before network access.
- [x] 3.4 Normalize built-in credential, quota, expiry, rate-limit, and network failures into localized actionable guidance without fallback requests or settings changes.

## 4. Settings UI and Localization

- [x] 4.1 Set the canonical built-in source `name` from the shared `Snaptium AI` constant and use that same `source.name` for its card title and every compatible selector option.
- [x] 4.2 Render one locked built-in source card first in the source list, using existing Snaptium branding and showing chat, embedding, and reranker model aliases in the same card without exposing the service address or redundant capability summary.
- [x] 4.3 Ensure AI Assistant and all compatible Knowledge Copilot dropdowns use the same built-in option and require no model selection from the user.
- [x] 4.4 Add the required privacy-confirmation and unavailable-service copy to the Simplified Chinese locale through the existing i18n system; do not add an i18n entry for the invariant `Snaptium AI` brand name.

## 5. Verification and Release Controls

- [x] 5.1 Add unit tests for configuration validation, canonical injection/stripping, forged-ID handling, one-time defaults, custom-selection preservation, and per-capability routing.
- [x] 5.2 Add tests for consent accept/decline/concurrency, process-lifetime credential reuse, one authentication-refresh retry, and explicit failure behavior with no cross-provider fallback.
- [x] 5.3 Run `npm run build:main`, `npm run typecheck`, relevant unit tests or `npm run test:unit`, `npm run lint`, and strict OpenSpec change validation.
- [x] 5.4 Verify release artifacts do not contain the remotely fetched token and that settings files, exported configuration, diagnostics, logs, Renderer, and Preload do not expose it.
- [ ] 5.5 Before release, configure the NEW API token allowlist, finite quota, expiry, dedicated group rate limits, monitoring, and documented rotation/revocation procedure; verify an unapproved model request is rejected.
