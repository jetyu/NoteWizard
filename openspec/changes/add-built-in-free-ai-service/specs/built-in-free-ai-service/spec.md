## ADDED Requirements

### Requirement: One built-in source represents all AI capabilities
The application SHALL expose exactly one immutable built-in AI source with chat, embedding, and reranking capabilities, SHALL obtain its invariant `Snaptium AI` brand name from a shared constant rather than i18n, and SHALL use that same name for the card title and source-selector options.

#### Scenario: User views AI sources
- **WHEN** the user opens AI source settings
- **THEN** one card displays the canonical built-in source name and the three corresponding model aliases
- **AND** the card does not display the service address or the redundant model-capability summary
- **AND** the card cannot be edited or deleted

#### Scenario: User changes language
- **WHEN** the active locale changes
- **THEN** the built-in card and selector option continue to display the invariant brand name `Snaptium AI`

#### Scenario: User opens a capability source selector
- **WHEN** the user opens the AI Assistant chat, Knowledge Copilot embedding, Ask chat, Agent chat, or reranker source selector
- **THEN** the compatible selector contains one `Snaptium AI` option whose text is the same canonical name used by the source card, rather than separate built-in options per capability

### Requirement: Built-in requests use capability-specific models
The application SHALL resolve the single built-in source to `snaptium-chat` for chat, `snaptium-embedding` for embeddings, and `snaptium-reranker` for reranking.

#### Scenario: AI Assistant sends a request
- **WHEN** AI Assistant uses the built-in source
- **THEN** Main sends the request to `/chat/completions` with model `snaptium-chat`

#### Scenario: Knowledge Copilot indexes notes
- **WHEN** Knowledge Copilot creates embeddings with the built-in source
- **THEN** Main sends the request to `/embeddings` with model `snaptium-embedding`

#### Scenario: Knowledge Copilot answers or acts
- **WHEN** Knowledge Copilot Ask or Agent mode uses the built-in source
- **THEN** Main sends the chat request with model `snaptium-chat`

#### Scenario: Knowledge Copilot reranks evidence
- **WHEN** Knowledge Copilot reranks documents with the built-in source
- **THEN** Main sends the request to `/rerank` with model `snaptium-reranker`

### Requirement: Main owns canonical built-in configuration
The application MUST fetch the public token from the designated HTTPS static URL in Main, validate and cache it only in memory for the Main process lifetime, combine it with the base URL and capability model map from shared constants, and MUST NOT trust Renderer or persisted copies of those values.

#### Scenario: Runtime settings are loaded
- **WHEN** Main normalizes application settings
- **THEN** Main injects one canonical built-in source with an empty Renderer-visible API key

#### Scenario: Settings are saved locally
- **WHEN** settings cross the local persistence boundary
- **THEN** the virtual built-in source and its token are omitted
- **AND** the built-in initialization and consent state remain persisted locally

#### Scenario: Settings are exported
- **WHEN** the user exports a portable configuration package
- **THEN** the virtual built-in source, token, initialization marker, and consent version are omitted
- **AND** compatible AI role selections remain part of the exported user configuration

#### Scenario: Settings are imported
- **WHEN** the user imports a portable configuration package
- **THEN** Main retains the receiving device's built-in initialization and consent state
- **AND** imported data cannot grant built-in AI consent

#### Scenario: Imported settings forge the reserved source
- **WHEN** an imported configuration contains a source with the reserved built-in ID
- **THEN** Main discards that record and reconstructs the canonical built-in source

#### Scenario: Renderer inspects exposed APIs and settings
- **WHEN** Renderer reads settings or calls preload APIs
- **THEN** no API returns the built-in token

#### Scenario: Concurrent operations require the token
- **WHEN** multiple built-in operations request a token while no valid cached value exists
- **THEN** Main performs one static credential request and shares the validated result

#### Scenario: Later operations reuse the session token
- **WHEN** later built-in operations run in the same application session without an authentication rejection
- **THEN** Main reuses the in-memory token without another static credential request

#### Scenario: Service rejects the cached token
- **WHEN** a built-in request receives `401` or `403`
- **THEN** Main invalidates that rejected token, fetches the current token, and retries the original request once
- **AND** Main does not retry indefinitely if the refreshed token is also rejected

#### Scenario: Static credential retrieval fails
- **WHEN** the static endpoint is unavailable, returns a non-success response, or returns invalid content
- **THEN** the built-in operation stops before sending user content and reports the localized unavailable-service error

### Requirement: Unconfigured installations receive one-time defaults
The application SHALL preselect the built-in source for AI Assistant and all compatible Knowledge Copilot roles once when no user-managed AI source exists, without enabling either feature.

#### Scenario: Fresh installation loads settings
- **WHEN** no persisted AI configuration exists
- **THEN** the built-in source and matching capability aliases are selected for all AI roles
- **AND** AI Assistant and Knowledge Copilot remain disabled

#### Scenario: Unconfigured existing installation upgrades
- **WHEN** an existing configuration has no user-managed AI source and built-in initialization has not run
- **THEN** the built-in source is selected once without changing feature enablement

#### Scenario: Existing user has a custom source
- **WHEN** built-in initialization runs and at least one user-managed source exists
- **THEN** existing source selections are not replaced by the built-in source

#### Scenario: User clears an optional role after initialization
- **WHEN** the initialization marker is already persisted and the user clears an optional Knowledge Copilot role
- **THEN** subsequent settings normalization preserves the cleared role

### Requirement: Built-in service requires first-use consent
The application MUST obtain versioned user confirmation before sending the first prompt, text, or note content to the built-in service.

#### Scenario: First built-in operation is attempted
- **WHEN** the stored consent version is absent or older than the required version
- **THEN** the application explains that content will be sent to Snaptium's hosted AI service and asks for confirmation before making a network request

#### Scenario: User accepts
- **WHEN** the user accepts the first-use confirmation
- **THEN** the application persists the current consent version and continues the requested operation

#### Scenario: User declines
- **WHEN** the user declines the first-use confirmation
- **THEN** the requested operation stops without sending content or changing feature/source settings

#### Scenario: Concurrent operations require consent
- **WHEN** multiple built-in operations reach the consent boundary concurrently
- **THEN** the application presents one confirmation and all operations use its result

### Requirement: Built-in failure is explicit and does not change providers
The application SHALL report built-in authentication, quota, expiry, rate-limit, and availability failures with actionable guidance and SHALL NOT silently use another provider.

#### Scenario: Public service rejects or cannot complete a request
- **WHEN** a built-in request still fails because of credentials after the one permitted refresh, or fails because of quota, expiry, rate limiting, or network availability
- **THEN** a localized message identifies the built-in source by its canonical `Snaptium AI` name and tells the user that a custom AI source can be selected
- **AND** the application preserves all source selections and feature switches
- **AND** no fallback request is sent to another provider

### Requirement: Public token has bounded backend permissions
The release SHALL use a dedicated NEW API token restricted to the three built-in model aliases with finite quota, expiry, rate limits, monitoring, and a documented revocation procedure.

#### Scenario: Token requests an unapproved model
- **WHEN** the public token requests a model other than the three built-in aliases
- **THEN** NEW API rejects the request

#### Scenario: Token reaches an operational limit
- **WHEN** the token exceeds its configured quota, expiry, or group rate limit
- **THEN** NEW API rejects the request and the client applies the explicit built-in failure behavior
