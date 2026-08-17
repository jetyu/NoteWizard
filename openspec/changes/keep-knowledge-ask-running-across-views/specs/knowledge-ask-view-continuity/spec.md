## ADDED Requirements

### Requirement: Ask continues across main-view navigation
The system SHALL keep an in-flight Knowledge Ask request running when the user switches from the Knowledge Assistant to another main view.

#### Scenario: Leave while Ask is generating
- **WHEN** the user submits an Ask question and switches to another main view before generation finishes
- **THEN** the request continues receiving progress and answer output without being cancelled by view navigation

#### Scenario: Return while Ask is generating
- **WHEN** the user returns to the Knowledge Assistant while the same Ask request is still running
- **THEN** the system shows that question as generating with its current stage and streamed content

#### Scenario: Return after Ask finishes
- **WHEN** the Ask request finishes while the user is viewing another main view and the user later returns
- **THEN** the system shows the completed answer and sources in the original conversation

### Requirement: Inactive view lifecycle safety
The system SHALL suspend Search-view-only browser event listeners while the cached Knowledge Assistant view is inactive without clearing Ask execution state.

#### Scenario: Interact with another view during Ask
- **WHEN** the Knowledge Assistant is inactive and the user interacts with another main view
- **THEN** hidden Search UI document and resize handlers do not process those interactions while the Ask request continues
