## ADDED Requirements

### Requirement: All application capabilities are license-free
The application SHALL allow users to configure and use AI sources, AI writing, Knowledge Copilot, external knowledge sources, WebDAV sync, and S3-compatible sync without activation, plan, device, entitlement, or license-network checks.

#### Scenario: Unactivated user uses application features
- **WHEN** a user installs or upgrades Snaptium without a license
- **THEN** every application capability is available subject only to its own functional configuration

#### Scenario: License service is unavailable
- **WHEN** Snaptium license endpoints are unreachable or retired
- **THEN** application startup and feature use proceed without contacting or depending on those endpoints

### Requirement: AI providers are user-managed
The application SHALL use only AI sources explicitly configured by the user and SHALL support existing OpenAI-compatible and Ollama configuration flows without a product license.

#### Scenario: User configures a custom AI source
- **WHEN** the user adds and tests a valid custom source
- **THEN** the source can be selected by AI Assistant and compatible Knowledge Copilot roles without activation

#### Scenario: Fresh installation has no AI provider
- **WHEN** Snaptium starts with default settings
- **THEN** no official AI source is present and AI-dependent operations require the user to configure a source

#### Scenario: User configures AI while a feature is disabled
- **WHEN** AI Assistant or Knowledge Copilot is disabled and at least one compatible custom source exists
- **THEN** the user can select and save that source before enabling the feature

#### Scenario: User enables AI before selecting a source
- **WHEN** the user enables AI Assistant or Knowledge Copilot without a compatible source selected
- **THEN** the enabled setting is preserved and the feature remains unconfigured until a source is selected

### Requirement: AI settings contain no official-source compatibility
The application SHALL normalize only user-managed AI sources and SHALL NOT retain official-source identifiers, filters, or migration branches.

#### Scenario: Settings are saved or imported
- **WHEN** AI settings cross a Main or Renderer settings boundary
- **THEN** valid custom sources are preserved and invalid selections are cleared without changing feature enablement

### Requirement: License and official AI client contracts are absent
The application SHALL NOT expose license activation, validation, device management, feature entitlement, official AI token, or official AI source APIs through Main, Preload, Renderer, menus, or runtime diagnostics.

#### Scenario: Application initializes
- **WHEN** Main and Renderer startup complete
- **THEN** no license state is loaded, broadcast, displayed, or included in diagnostics

#### Scenario: User opens application menus and settings
- **WHEN** the user navigates through the application shell
- **THEN** no activation, paid-plan, license badge, or feature-lock interface is shown
