## ADDED Requirements

### Requirement: Configurable index rebuild concurrency
The system SHALL let users select the number of notes processed concurrently during a Knowledge Copilot index rebuild from a constrained numeric dropdown in Index Settings.

#### Scenario: Default concurrency
- **WHEN** existing settings do not contain a rebuild concurrency value
- **THEN** the system uses a rebuild concurrency of 3

#### Scenario: Non-Snaptium embedding source
- **WHEN** the selected embedding source is not provided by Snaptium AI
- **THEN** the dropdown offers integer concurrency values from 1 through 6

#### Scenario: Subsequent rebuild uses selected value
- **WHEN** the user selects a valid concurrency and starts a later index rebuild
- **THEN** the system schedules changed notes using that concurrency

### Requirement: Safe concurrent vector-store writes
The system MUST serialize vector-store mutations produced by concurrent index workers while allowing embedding requests to remain concurrent.

#### Scenario: Concurrent first writes after a full rebuild
- **WHEN** multiple notes finish embedding after the previous vector table has been cleared
- **THEN** the system creates the new table once and writes each completed batch without a table-creation race

### Requirement: Snaptium AI concurrency limit
The system MUST limit index rebuild concurrency to at most 3 when the selected embedding source is provided by Snaptium AI.

#### Scenario: Snaptium AI selected in Index Settings
- **WHEN** Snaptium AI is the current embedding source
- **THEN** the concurrency dropdown offers only integer values from 1 through 3

#### Scenario: Source changes to Snaptium AI
- **WHEN** the user switches from another embedding source with a concurrency greater than 3 to Snaptium AI
- **THEN** the system changes and persists the configured concurrency as 3

#### Scenario: Stale Snaptium AI configuration
- **WHEN** a rebuild starts with Snaptium AI and persisted concurrency greater than 3
- **THEN** the runtime scheduler uses an effective concurrency of 3
