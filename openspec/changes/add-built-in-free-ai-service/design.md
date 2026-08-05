## Context

Snaptium already models one AI source as one provider, endpoint, API key, default model, and capability list. AI Assistant selects one chat-capable source, while Knowledge Copilot independently selects embedding, Ask chat, Agent chat, and reranker sources. A single `aiModel` cannot correctly represent the three models requested for the built-in source.

The application previously had three separate official sources backed by license tokens. That design was removed because it coupled AI availability to licensing and quota infrastructure. This change restores a smaller built-in option without licensing: one visible source, three capability-specific aliases, a public shared NEW API token, and server-side quota controls.

The repository, packaged Electron application, and static credential URL are public. The token is therefore a public credential. Main-only fetching prevents accidental Renderer-state, settings-export, bundle, and logging exposure; it does not make the token secret or prevent direct downloads.

## Goals / Non-Goals

**Goals:**

- Present exactly one immutable built-in source in the AI source list and every compatible source selector; its invariant `Snaptium AI` brand name comes from one shared constant, and selectors display that same name as the card title.
- Resolve chat, embedding, and reranking to different stable aliases from one source.
- Make an unconfigured installation ready to use after the user enables an AI feature.
- Keep the shared token out of Renderer contracts, persisted settings, exported configuration, diagnostics, and logs.
- Obtain versioned consent before the first built-in request and fail transparently when the public service is unavailable.
- Preserve existing user-managed providers and selections.

**Non-Goals:**

- Hiding the public token from users who directly request the static credential URL.
- Adding accounts, licensing, payments, device attestation, per-user tokens, or a new proxy service.
- Dynamically discovering or classifying NEW API models at runtime.
- Automatically failing over to another provider or changing AI feature switches.
- Generalizing all custom sources to require three different default models.

## Decisions

1. **Represent the built-in service as one canonical runtime source.** Add a reserved source ID, invariant `Snaptium AI` source-name constant, and `snaptium` provider with all three capabilities. The source carries a capability-to-model map in addition to the existing custom-source `aiModel` fallback. Renderer cards and selectors display the same canonical `source.name`; user-managed sources continue to display their saved names. The invariant brand name is intentionally not localized.

2. **Keep the source virtual and canonicalize it in Main.** Main settings normalization removes any persisted or imported record using the reserved ID, prepends a canonical built-in source with an empty `apiKey`, and returns that runtime view. Before writing or exporting settings, Main strips the virtual source again. Portable configuration exports additionally omit the built-in initialization and consent state; imports retain the receiving device's local state rather than accepting those markers from a package. Renderer add/update/delete operations must reject the reserved ID. This prevents stale metadata, transferred consent, or a forged imported source from replacing the built-in definition.

3. **Fetch credentials in Main only.** The public base URL and `chat`, `embedding`, and `reranker` aliases live in shared constants. On the first built-in operation, the Main built-in AI service downloads the public shared token from `https://snaptium.com/key.txt`, trims and validates the plain-text response, coalesces concurrent loads, and caches it in memory for the rest of the Main process lifetime. A `401` or `403` response invalidates the rejected token, fetches the current token, and retries the original request once; other failures preserve the session cache. No preload or IPC API returns the token, and the token is absent from Git and packaged bundles.

4. **Use stable NEW API aliases.** The client requests `snaptium-chat`, `snaptium-embedding`, and `snaptium-reranker`. NEW API maps those aliases to actual upstream models, allowing server-side model replacement without a desktop release. The shared token is restricted to exactly those aliases.

5. **Resolve models at the capability boundary.** Shared source-model selection returns `capabilityModels[capability]` when present and otherwise preserves the existing `aiModel` behavior. AI Assistant uses the chat alias; Knowledge Copilot uses embedding for indexing, chat for Ask and Agent, and reranker for compression. Main combines the canonical shared endpoint/model constants with the remotely fetched token rather than trusting Renderer or persisted values.

6. **Apply built-in defaults once without enabling features.** Add device-local persisted built-in state containing `initialSelectionApplied` and `consentVersion`. On the first normalization of a fresh or upgraded configuration with no user-managed AI source, select the built-in source for AI Assistant and all four Knowledge Copilot roles and write the corresponding capability aliases. Mark the initialization as applied so later user-cleared optional roles remain cleared. If user-managed sources already exist, mark initialization complete without replacing their selections. Existing `enabled` flags remain unchanged. This local state is not part of a portable configuration export.

7. **Gate the first actual request with versioned consent.** At each built-in network boundary, settings service checks the device-local consent version before sending any content. If it is stale or absent, a single coalesced native confirmation explains that prompts and note content will be sent to Snaptium's hosted AI service. Accepting persists the current version locally and continues; declining aborts before network access. Incrementing the required version can request consent again after a material privacy-policy change. Importing a configuration cannot grant or replace consent on the receiving device.

8. **Do not silently recover across providers.** Built-in authentication, quota, expiry, rate-limit, and network failures are normalized to localized i18n messages that identify the built-in service by its canonical source name and recommend selecting a custom source. The selected source and feature switches are not changed, and no request is sent to another provider automatically.

9. **Treat backend restrictions as a release prerequisite.** The NEW API token must have a finite quota and expiry, a three-model allowlist, a dedicated group with request limits, usage monitoring, and documented rotation/revocation. Client-side limits are not security controls because the repository and executable are modifiable.

## Risks / Trade-offs

- [Anyone can copy and automate the public token] → Restrict models, quota, expiry, and group rate; monitor usage and retain an emergency revocation path.
- [The static credential endpoint is unavailable or serves invalid content] → Validate the response, coalesce and cache successful reads, show actionable failure guidance, and never send content without a valid token.
- [A forged settings import could impersonate the reserved source] → Strip the reserved ID at Main boundaries and reconstruct the canonical runtime source.
- [Automatically injected defaults could overwrite intentional settings] → Run initialization once, only auto-select when no user-managed source exists, and never change feature enablement.
- [Concurrent background operations could display duplicate consent dialogs] → Coalesce consent checks through one in-flight Main promise and make no request until it resolves.
- [The same upstream error has different shapes across OpenAI-compatible paths] → Normalize built-in failures at Main AI call boundaries while preserving raw details only in redacted diagnostics.

## Migration Plan

1. Configure NEW API aliases, issue a dedicated restricted public token, and publish it at the HTTPS static credential URL.
2. Ship settings normalization that injects the canonical source and performs one-time default selection for unconfigured installations.
3. Release through the existing tag and Microsoft Store GitHub Actions; verify packaged bundles and settings exports do not contain the token and Main can retrieve it from the static URL.
4. Monitor token usage and 401/403/429 rates after release. Roll back by revoking the token and releasing a build without the built-in source; custom sources remain unaffected.

## Open Questions

- Operational quota, expiry, rate-limit, monitoring, and rotation thresholds must be confirmed by the NEW API administrator before release.
