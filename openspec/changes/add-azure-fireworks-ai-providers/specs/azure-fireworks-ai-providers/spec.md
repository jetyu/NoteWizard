## ADDED Requirements

### Requirement: Azure OpenAI provider preset

The system SHALL offer Azure OpenAI as a selectable AI provider with chat and embedding capabilities through an editable OpenAI-compatible v1 endpoint.

#### Scenario: Configure an Azure OpenAI source
- **WHEN** a user selects Azure OpenAI while adding an AI source
- **THEN** the system displays Azure-specific endpoint and deployment-name guidance
- **AND** the user can enter the resource endpoint, API key, and deployment name before testing and saving.

#### Scenario: Use an Azure OpenAI model
- **WHEN** a configured Azure OpenAI source is selected for chat or embedding
- **THEN** the system sends the request through the existing OpenAI-compatible adapter using the configured v1 base URL and deployment name.

### Requirement: Fireworks AI provider preset

The system SHALL offer Fireworks AI as a selectable provider with the default base URL `https://api.fireworks.ai/inference/v1` and chat, embedding, and reranking capabilities.

#### Scenario: Configure a Fireworks AI source
- **WHEN** a user selects Fireworks AI while adding an AI source
- **THEN** the source receives the Fireworks inference base URL and exposes chat, embedding, and reranking capability choices.

#### Scenario: Rerank documents with Fireworks AI
- **WHEN** a configured Fireworks reranker is used by Knowledge Copilot
- **THEN** the system sends the query and documents to the configured `/rerank` endpoint
- **AND** orders the documents using the returned indices and relevance scores.

### Requirement: Provider identity and presentation

The system SHALL assign Azure OpenAI and Fireworks AI stable provider identities, Simplified Chinese labels, and local brand icons.

#### Scenario: View a provider
- **WHEN** a user opens the provider selector or views a saved Azure OpenAI or Fireworks AI source
- **THEN** the corresponding provider label and local icon are displayed.

### Requirement: Endpoint-based provider inference

The system SHALL infer Fireworks AI from its public API host and Azure OpenAI from supported Azure OpenAI-compatible v1 endpoint hosts and paths.

#### Scenario: Load a source without a valid provider identity
- **WHEN** a saved source has a recognized Fireworks or Azure OpenAI-compatible v1 base URL but no valid provider identity
- **THEN** the system assigns the corresponding first-class provider identity instead of the generic OpenAI-compatible identity.

### Requirement: No-model empty state remains contextual

The system SHALL display the existing add-AI-service guidance only when no source supports the capability required by the smart-writing or Knowledge Copilot selector.

#### Scenario: No compatible source exists
- **WHEN** a settings selector has no AI source with its required capability
- **THEN** the selector is disabled and the user is told to add an AI service configuration.

#### Scenario: A compatible source exists
- **WHEN** at least one AI source supports the selector's required capability
- **THEN** the normal feature description and selectable source options are displayed.
