## ADDED Requirements

### Requirement: Writing preferences apply across Smart Writing
The system SHALL apply the configured tone and style and application scenario to both automatic continuation and explicit editor Smart Writing operations.

#### Scenario: Automatic continuation is generated
- **WHEN** the system builds an automatic continuation prompt
- **THEN** the prompt includes the current tone and style and application scenario instructions

#### Scenario: Explicit editor operation is generated
- **WHEN** the user invokes rewrite, expand, simplify, summarize, or translation from the editor context menu
- **THEN** the generated system prompt includes the current tone and style and application scenario instructions

#### Scenario: Auto-continue is disabled
- **WHEN** Smart Writing is enabled, Auto Continue is disabled, and the user invokes an explicit editor operation
- **THEN** the current global writing preferences still apply to that operation

### Requirement: Operation constraints take precedence over global preferences
The system SHALL treat global writing preferences as secondary constraints that cannot override the selected operation's task, source meaning, or required output language.

#### Scenario: Rewrite or transformation operation uses preferences
- **WHEN** global writing preferences are added to a rewrite, expand, simplify, or summarize prompt
- **THEN** the operation still preserves its task-specific objective and required output-only format

#### Scenario: Translation uses preferences
- **WHEN** global writing preferences are added to a translation prompt
- **THEN** the target language, source fidelity, preserved structure, and translation-only output requirements remain authoritative

### Requirement: Main process resolves global preferences
The system SHALL build explicit editor operation prompts from the normalized Smart Writing settings resolved in the Main process.

#### Scenario: Renderer requests a preset operation
- **WHEN** the Renderer sends an editor prompt preset without an explicit system message
- **THEN** the Main process reads the current normalized tone and style and application scenario and includes them in the generated system prompt
