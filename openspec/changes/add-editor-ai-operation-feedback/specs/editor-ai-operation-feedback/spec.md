## ADDED Requirements

### Requirement: Smart-writing operations show contextual progress

The editor SHALL show an indeterminate, action-specific progress card beside the source selection immediately after a user starts rewrite, expand, simplify, or summarize.

#### Scenario: Generation starts

- **WHEN** the user selects text and invokes a smart-writing action
- **THEN** the editor SHALL preserve and decorate the source range
- **AND** the editor SHALL show the corresponding processing label without a determinate percentage

#### Scenario: Source selection is outside the visible viewport

- **WHEN** an active operation's source range scrolls outside the rendered editor viewport
- **THEN** the progress card SHALL remain visible by docking to the nearest editor edge

### Requirement: Generated text requires confirmation

The editor SHALL present generated text as a plain-text preview without modifying the document until the user confirms it.

#### Scenario: User applies a valid result

- **WHEN** generation succeeds and the source range remains valid
- **AND** the user chooses Apply
- **THEN** the editor SHALL replace the tracked source range with the generated text
- **AND** the editor SHALL place the cursor after the inserted text

#### Scenario: User discards a result

- **WHEN** generation succeeds and the user chooses Discard
- **THEN** the editor SHALL close the operation card
- **AND** the original document SHALL remain unchanged

### Requirement: Source range remains safe while editing continues

The editor SHALL track the originating source range independently from the current cursor and selection.

#### Scenario: User moves the cursor

- **WHEN** the user moves the cursor or selects different text while generation is pending
- **THEN** applying the result SHALL still target the original source range

#### Scenario: User edits outside the source range

- **WHEN** the user edits text before or after the source range
- **THEN** the editor SHALL map the source range to its new positions
- **AND** the result SHALL remain eligible for application

#### Scenario: User edits the source range

- **WHEN** a document change overlaps the tracked source range
- **THEN** the editor SHALL mark the operation invalid
- **AND** it SHALL NOT apply the generated result
- **AND** it SHALL instruct the user to select the text again

#### Scenario: User switches notes

- **WHEN** the active note changes before an operation is applied
- **THEN** the editor SHALL discard the local operation state
- **AND** a late AI response SHALL NOT modify either note

### Requirement: Smart-writing failure is recoverable

The editor SHALL show generation failures in the selection-anchored card while preserving the original text.

#### Scenario: Generation request fails

- **WHEN** the AI service returns an error
- **THEN** the editor SHALL show an error state with Retry and Close actions
- **AND** the original document SHALL remain unchanged

#### Scenario: User retries a valid failed operation

- **WHEN** the source range remains valid and the user chooses Retry
- **THEN** the editor SHALL rerun the same smart-writing action for the original source text
- **AND** the card SHALL return to the processing state

### Requirement: Editor limits concurrent smart-writing operations

The editor SHALL allow at most one active context-menu smart-writing operation.

#### Scenario: Context menu opens during an active operation

- **WHEN** a pending, preview, or error operation is active
- **THEN** the editor SHALL keep ordinary context-menu actions available
- **AND** it SHALL disable all smart-writing actions

### Requirement: Smart-writing operations suspend automatic completion

The editor SHALL suspend automatic writing completion while a context-menu smart-writing operation is active without changing the user's saved completion settings.

#### Scenario: Smart-writing operation starts

- **WHEN** a pending, preview, or error smart-writing operation becomes active
- **THEN** the editor SHALL clear any visible automatic completion suggestion
- **AND** it SHALL cancel pending completion timers and invalidate in-flight completion responses
- **AND** it SHALL NOT schedule another automatic completion

#### Scenario: Smart-writing operation closes

- **WHEN** the user applies, discards, or closes the active smart-writing operation
- **THEN** the editor SHALL remove the temporary completion suspension
- **AND** future typing SHALL use the user's existing automatic completion settings
