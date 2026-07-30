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
- **THEN** no official AI source is present and AI-dependent features remain disabled until the user configures a source

### Requirement: Legacy official AI settings migrate safely
The application SHALL remove legacy Snaptium official AI sources and their selections while preserving custom sources and unrelated settings.

#### Scenario: Upgrade contains only official AI selections
- **WHEN** saved settings reference a legacy `snaptium-official-*` source
- **THEN** the source and selection are cleared and the affected AI-dependent feature is disabled

#### Scenario: Upgrade contains custom sources
- **WHEN** saved settings contain one or more custom sources alongside legacy official sources
- **THEN** every valid custom source and valid custom selection is preserved

#### Scenario: Imported configuration contains official sources
- **WHEN** a configuration package containing legacy official source records is imported
- **THEN** the same filtering and dependent-setting normalization are applied before persistence

### Requirement: License and official AI client contracts are absent
The application SHALL NOT expose license activation, validation, device management, feature entitlement, official AI token, or official AI source APIs through Main, Preload, Renderer, menus, or runtime diagnostics.

#### Scenario: Application initializes
- **WHEN** Main and Renderer startup complete
- **THEN** no license state is loaded, broadcast, displayed, or included in diagnostics

#### Scenario: User opens application menus and settings
- **WHEN** the user navigates through the application shell
- **THEN** no activation, paid-plan, license badge, or feature-lock interface is shown
