## ADDED Requirements

### Requirement: Anthropic provider configuration
The system SHALL expose Anthropic as a selectable AI provider with the default base URL `https://api.anthropic.com`, an editable model field, and Chat as its only supported capability.

#### Scenario: Select Anthropic
- **WHEN** the user selects Anthropic while creating or editing an AI source
- **THEN** the system fills the Anthropic default endpoint, selects only Chat, and leaves the model field available for user input

#### Scenario: Persist Anthropic identity
- **WHEN** an Anthropic AI source is saved and later restored
- **THEN** the system preserves the `anthropic` provider identity and its configured values

#### Scenario: Infer Anthropic endpoint
- **WHEN** a saved source without a recognized provider identity uses an `api.anthropic.com` endpoint
- **THEN** the system infers Anthropic as its provider

### Requirement: Native Claude chat integration
The system SHALL create Anthropic chat models through the native LangChain Anthropic adapter using the configured API key, endpoint, and model.

#### Scenario: Use Claude for chat
- **WHEN** an Anthropic source is selected for a Chat role
- **THEN** Ask and knowledge-agent chat requests use the configured Claude model

#### Scenario: Test Anthropic connection
- **WHEN** the user tests an Anthropic source with valid Chat configuration
- **THEN** the existing connection test invokes the Claude chat model and reports the result

#### Scenario: Validate Claude Tool Calling
- **WHEN** the user validates Tool Calling for an Anthropic source
- **THEN** the existing validation flow binds and invokes a test tool through the Claude chat model

#### Scenario: Reject unsupported Anthropic capabilities
- **WHEN** the model factory is asked to create Anthropic embeddings or a reranker
- **THEN** it reports that Anthropic does not support the requested capability

### Requirement: Anthropic provider presentation
The system SHALL show Anthropic in the provider selector with a local icon and a Simplified Chinese label.

#### Scenario: Display Anthropic option
- **WHEN** the AI source provider selector is opened
- **THEN** an Anthropic option appears with its label and icon
