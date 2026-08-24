## ADDED Requirements

### Requirement: Auto-continue gates input-triggered predictions
The system SHALL request inline continuation predictions from editor input only when both Smart Writing and Auto Continue are enabled.

#### Scenario: User types with auto-continue enabled
- **WHEN** Smart Writing and Auto Continue are enabled and eligible editor input reaches the configured trigger point
- **THEN** the system requests an inline continuation prediction

#### Scenario: User types with auto-continue disabled
- **WHEN** Smart Writing is enabled, Auto Continue is disabled, and the user types in the editor
- **THEN** the system does not request an inline continuation prediction

#### Scenario: User disables auto-continue during pending work
- **WHEN** the user disables Auto Continue while an inline suggestion, scheduled prediction, or prediction request exists
- **THEN** the system clears the suggestion and cancels or invalidates the pending prediction work

### Requirement: Active writing operations remain independent
The system SHALL keep explicit editor Smart Writing operations independent from the Auto Continue switch.

#### Scenario: User invokes a context-menu operation with auto-continue disabled
- **WHEN** Smart Writing is enabled, Auto Continue is disabled, and the user invokes an available rewrite, expand, simplify, summarize, or translation action
- **THEN** the system runs the selected operation normally

#### Scenario: Smart Writing is disabled
- **WHEN** Smart Writing is disabled
- **THEN** neither input-triggered predictions nor Smart Writing context-menu operations are available

### Requirement: Trigger strategy controls automatic prediction timing
The system SHALL apply the selected trigger strategy to eligible predictions initiated after ordinary user input, without applying that strategy to explicit context-menu operations.

#### Scenario: Ordinary input reaches its trigger point
- **WHEN** Auto Continue is enabled and ordinary user input is eligible for prediction
- **THEN** the system uses the selected Focus, Standard, or Aggressive delay and cooldown values

#### Scenario: Accepted suggestion requests a continuation
- **WHEN** Auto Continue is enabled and the user accepts an inline suggestion
- **THEN** the system requests the next continuation using the continuous-completion delay without the ordinary-input cooldown

#### Scenario: Context-menu operation is invoked
- **WHEN** the user invokes a Smart Writing context-menu operation
- **THEN** the selected automatic continuation trigger strategy does not delay or otherwise alter that operation

### Requirement: Smart Writing settings communicate functional ownership
The system SHALL present Smart Writing settings in functional regions that reflect which behavior each setting controls.

#### Scenario: User opens Smart Writing settings
- **WHEN** the Smart Writing settings page is displayed
- **THEN** the page shows, in order, a Basic Settings region containing the master switch and model service, a Writing Preferences region containing tone and style and application scenario, an Auto Continue region containing Auto Continue and trigger strategy, and a Quick Actions region containing quick translation

#### Scenario: Auto-continue is unavailable
- **WHEN** Smart Writing is disabled or Auto Continue is disabled
- **THEN** trigger strategy remains visible but cannot be changed

#### Scenario: Auto-continue is available
- **WHEN** Smart Writing and Auto Continue are both enabled
- **THEN** trigger strategy can be changed

#### Scenario: Writing preferences remain global
- **WHEN** Smart Writing is enabled and Auto Continue is disabled
- **THEN** tone and style and application scenario remain configurable because they also apply to explicit editor actions

#### Scenario: Quick translation remains configurable
- **WHEN** Smart Writing is enabled and Auto Continue is disabled
- **THEN** the quick translation target remains configurable because it belongs to explicit editor actions

### Requirement: Existing settings remain compatible
The system SHALL preserve the existing Smart Writing configuration shape and stored values while applying the clarified Auto Continue behavior.

#### Scenario: Existing auto-continue value is loaded
- **WHEN** a previously stored `autoContinue` value is loaded after the change
- **THEN** the system uses that value for the clarified input-triggered prediction behavior without requiring a settings migration
