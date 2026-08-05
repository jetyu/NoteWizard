## ADDED Requirements

### Requirement: One authoritative settings normalization path
The application SHALL convert defaults, persisted settings, Renderer saves, and imported configuration packages through one authoritative Main-process normalization entry.

#### Scenario: Settings are loaded
- **WHEN** persisted settings are read from disk
- **THEN** the application returns a complete current `AppSettings` object produced by the authoritative normalizer

#### Scenario: Settings are saved or imported
- **WHEN** settings arrive from Renderer IPC or a configuration package
- **THEN** the same normalization rules are applied before persistence

#### Scenario: Defaults are requested
- **WHEN** no input settings are provided
- **THEN** the normalizer produces the complete current default configuration

### Requirement: Current settings shape is explicit and typed
The application MUST explicitly construct every supported top-level and nested setting and SHALL use concrete types for AI Assistant and Knowledge Copilot configuration.

#### Scenario: Valid current settings are normalized
- **WHEN** input contains valid current settings
- **THEN** their values are preserved subject to documented type, capability, and numeric constraints

#### Scenario: Fields are missing or malformed
- **WHEN** a supported setting is missing or has an invalid value
- **THEN** that field receives its current default or normalized fallback without affecting unrelated fields

#### Scenario: Input contains unknown fields
- **WHEN** settings input contains a field not present in the current settings model
- **THEN** the field is omitted from the normalized and persisted result

### Requirement: Settings are grouped by module
The application SHALL represent each settings Tab or internal settings domain as one typed config object and SHALL keep unrelated leaf fields out of the `AppSettings` root.

#### Scenario: Complete settings are normalized
- **WHEN** the Main process produces current settings
- **THEN** the root contains module configs such as `general`, `preview`, `editor`, `aiSources`, `noteStorage`, `privacyLog`, and `softwareUpdate`
- **AND** each module is produced by its dedicated config normalizer

#### Scenario: Flat settings fields are supplied
- **WHEN** input contains a former root-level leaf such as `language`, `editorFontSize`, or `noteSavePath`
- **THEN** that flat field is ignored instead of being migrated into the grouped shape

### Requirement: Renderer settings actions follow config modules
The Renderer settings store SHALL expose feature actions under the module they modify and SHALL expose load, save, import, export, and reset under a separate persistence module.

#### Scenario: A settings Tab changes a value
- **WHEN** the Editor, General, Preview, Sync, or another settings Tab updates its config
- **THEN** it calls the matching module API rather than a flat store action

#### Scenario: Settings lifecycle operation runs
- **WHEN** settings are loaded, saved, imported, exported, or reset
- **THEN** the operation is accessed through the persistence API

### Requirement: AI feature enablement is independent from source selection
The application SHALL preserve current AI Assistant and Knowledge Copilot enablement while normalizing source selections against current user-managed AI sources.

#### Scenario: Feature is enabled without a compatible source
- **WHEN** AI Assistant or Knowledge Copilot is enabled and its required source is empty or invalid
- **THEN** the invalid source selection is cleared without disabling the feature

#### Scenario: Feature uses a compatible source
- **WHEN** an AI role references a configured source with the required capability
- **THEN** the source and model selection are preserved

### Requirement: Historical settings patches are absent
The application SHALL NOT retain Knowledge Copilot schema-version migration, historical Knowledge Agent cleanup, or legacy chat-field fallback behavior.

#### Scenario: Application starts
- **WHEN** settings are loaded
- **THEN** no settings migration mutates historical index files or rewrites configuration because of an obsolete schema version

#### Scenario: Obsolete fields are supplied
- **WHEN** settings input contains removed schema-version, Knowledge Agent, or legacy chat fields
- **THEN** those fields are ignored as unknown current settings

### Requirement: Settings IPC validates its boundary
The Main process MUST reject non-object settings-save payloads before settings persistence.

#### Scenario: Renderer sends a non-object payload
- **WHEN** the settings-save IPC handler receives a primitive, array, or null payload
- **THEN** validation fails and no settings file is written

#### Scenario: Renderer sends an object payload
- **WHEN** the settings-save IPC handler receives an object
- **THEN** the object is passed to the authoritative normalizer before persistence
