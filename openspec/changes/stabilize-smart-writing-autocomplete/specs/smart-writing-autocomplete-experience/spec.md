## ADDED Requirements

### Requirement: Completion results remain bound to the current writing snapshot
The system SHALL display an automatic continuation only when it still matches the current note identity, document content, cursor position, and empty selection captured for the latest request.

#### Scenario: User continues typing during a request
- **WHEN** a completion request is in progress and the user types more eligible text
- **THEN** the system invalidates the old result and schedules a prediction from the latest writing snapshot

#### Scenario: Cursor or selection changes during a request
- **WHEN** the cursor moves or the selection changes after a prediction was scheduled or requested
- **THEN** the system clears any visible suggestion and prevents the pending result from being displayed

#### Scenario: Active note changes during a request
- **WHEN** the user switches to another note after a prediction was scheduled or requested
- **THEN** the system invalidates the previous note's suggestion and pending result

#### Scenario: Snapshot remains unchanged
- **WHEN** the latest prediction returns and the note, document, cursor, and selection still match its captured snapshot
- **THEN** the system may display the validated suggestion at the captured cursor position

### Requirement: Automatic prediction distinguishes editor change origins
The system SHALL classify editor changes and SHALL only schedule automatic predictions for ordinary typing and completed acceptance of an AI suggestion.

#### Scenario: User types ordinary text
- **WHEN** an eligible document change originates from ordinary typing
- **THEN** the system invalidates prior work and schedules a prediction using the selected trigger strategy

#### Scenario: User pastes or drops content
- **WHEN** a document change originates from paste or drop
- **THEN** the system invalidates prior work without scheduling a prediction

#### Scenario: User performs history or formatting operations
- **WHEN** a document change originates from undo, redo, indentation, or an explicit formatting command
- **THEN** the system invalidates prior work without scheduling a prediction

#### Scenario: Note content is synchronized into the editor
- **WHEN** the editor document is replaced from external note state or a note switch
- **THEN** the system treats the change as external synchronization and does not schedule a prediction

### Requirement: Completion requests carry position-aware writing context
The system SHALL provide the completion prompt with bounded text before and after the cursor, the active note title, the current Markdown section heading, and a continuation intent derived from the cursor position.

#### Scenario: User writes within an unfinished sentence
- **WHEN** the cursor is at the end of unfinished prose with no following text
- **THEN** the request identifies a sentence-continuation intent and asks for a short phrase or at most one sentence

#### Scenario: User writes at a paragraph boundary
- **WHEN** the cursor follows a sentence-ending or paragraph boundary with no following text
- **THEN** the request identifies a paragraph-continuation intent and allows one or two coherent sentences in the same paragraph

#### Scenario: User edits between existing text
- **WHEN** meaningful text exists after the cursor
- **THEN** the request identifies a bridge intent and includes bounded following context so the suggestion can connect both sides

#### Scenario: Current section exists
- **WHEN** an ATX Markdown heading precedes the cursor
- **THEN** the request includes the nearest preceding heading together with the note title

### Requirement: Completion output passes a repetition and continuity gate
The system SHALL validate model output before display and SHALL not show a suggestion that repeats the recent source text, duplicates existing following text, is empty after cleanup, or no longer fits the captured snapshot.

#### Scenario: Model echoes the complete source suffix
- **WHEN** a returned suggestion starts with text already present at the end of the written context
- **THEN** the system removes the longest safe exact overlap and displays only the new continuation

#### Scenario: Model repeats the recent phrase with punctuation differences
- **WHEN** the beginning of a returned suggestion remains highly similar to the recent source phrase after deterministic overlap cleanup
- **THEN** the system rejects the suggestion instead of displaying repeated content

#### Scenario: Model predicts existing following text
- **WHEN** a returned bridge suggestion ends with text already present immediately after the cursor
- **THEN** the system removes the safe exact overlap before display

#### Scenario: Cleanup removes the whole answer
- **WHEN** output cleanup leaves no meaningful continuation
- **THEN** the system displays no suggestion

### Requirement: Writing preferences remain compatible with local continuity
The system SHALL apply global tone and scenario preferences only when they do not conflict with the source language, factual continuity, cursor position, or required connection to surrounding text.

#### Scenario: Source style differs from the global preference
- **WHEN** the local prose style differs from the configured global writing style
- **THEN** the completion prioritizes a natural transition and applies the preference without abruptly rewriting or echoing the source

#### Scenario: Bridge context constrains wording
- **WHEN** following text requires a specific grammatical or semantic connection
- **THEN** the bridge requirement takes precedence over optional stylistic expression

### Requirement: Users can accept suggestions at multiple granularities
The system SHALL support accepting the complete suggestion, the next word unit, or the next sentence unit while preserving default editor key behavior when no suggestion exists.

#### Scenario: User accepts the complete suggestion
- **WHEN** a suggestion is visible and the user presses Tab
- **THEN** the system inserts all remaining suggestion text and marks the acceptance complete

#### Scenario: User accepts the next word
- **WHEN** a suggestion is visible and the user presses Ctrl+ArrowRight
- **THEN** the system inserts the next word unit and keeps any remaining suggestion visible

#### Scenario: User accepts the next sentence
- **WHEN** a suggestion is visible and the user presses Ctrl+Shift+ArrowRight
- **THEN** the system inserts the next sentence unit and keeps any remaining suggestion visible

#### Scenario: No suggestion is visible
- **WHEN** the user presses an acceptance shortcut without an active suggestion
- **THEN** the system leaves the shortcut available to the editor's default key handling

### Requirement: The first suggestion explains its controls
The system SHALL append a localized acceptance and dismissal hint to the first successfully displayed suggestion in an editor session and SHALL keep later suggestions visually concise.

#### Scenario: First validated suggestion appears
- **WHEN** the first validated suggestion is displayed in the current editor session
- **THEN** the suggestion includes the localized Tab, partial acceptance, and Escape shortcut hint

#### Scenario: Later suggestion appears
- **WHEN** another validated suggestion is displayed in the same editor session
- **THEN** the suggestion omits the onboarding hint

### Requirement: Continuous prediction adapts to subsequent user intent
The system SHALL schedule a follow-up prediction after complete suggestion acceptance using a shortened delay derived from the selected trigger strategy, and SHALL cancel that follow-up when the user continues editing during the observation period.

#### Scenario: User accepts all and pauses
- **WHEN** the user completely accepts a suggestion and makes no further change during the adaptive delay
- **THEN** the system requests the next continuation using the shortened strategy-derived delay

#### Scenario: User accepts all and keeps typing
- **WHEN** the user completely accepts a suggestion and types during the adaptive delay
- **THEN** the system cancels the follow-up timer and schedules from the latest input using ordinary typing timing

#### Scenario: User partially accepts a suggestion
- **WHEN** the user accepts only the next word or sentence and suggestion text remains
- **THEN** the system keeps the remainder available without requesting another continuation
