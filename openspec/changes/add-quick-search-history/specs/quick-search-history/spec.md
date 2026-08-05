## ADDED Requirements

### Requirement: Record successful quick-search queries
The application SHALL record the trimmed quick-search query when the user opens a note from that query's result list. It SHALL keep at most 10 exact, non-empty, unique queries in most-recent-first order and SHALL promote a repeated query instead of duplicating it.

#### Scenario: Opening a note records its query
- **WHEN** the user opens a note from quick-search results for a non-empty query
- **THEN** the trimmed query becomes the first history entry

#### Scenario: Looking up without opening does not record
- **WHEN** a query is searched or restored from history without opening a note result
- **THEN** the history remains unchanged

#### Scenario: Repeating and limiting history
- **WHEN** a previously recorded exact query is used to open a note, or an eleventh unique query is recorded
- **THEN** the repeated query is moved to the front without duplication and only the 10 newest entries remain

### Requirement: Persist history locally and safely
The application SHALL retain quick-search history across application restarts on the current device without adding it to settings export, import, or synchronization. Invalid or unavailable storage SHALL NOT prevent quick note search from working.

#### Scenario: Reload persisted history
- **WHEN** the application starts with valid locally stored quick-search history
- **THEN** it loads the sanitized history in most-recent-first order

#### Scenario: Handle invalid or unavailable storage
- **WHEN** stored history is malformed or browser storage access fails
- **THEN** quick note search remains usable and history operations continue in memory for the current run

### Requirement: Display and reuse search history
The application SHALL show history in the title-bar search dropdown when the input is focused, empty, and history exists. Activating a history entry SHALL fill the input and immediately perform the corresponding note search without recording it.

#### Scenario: Focus empty quick search
- **WHEN** the quick-search input gains focus while empty and history contains entries
- **THEN** the dropdown displays those entries from newest to oldest

#### Scenario: Reuse a history entry
- **WHEN** the user clicks a history entry or selects it with the keyboard
- **THEN** its query fills the input and note results are requested immediately

#### Scenario: Switch between history and results
- **WHEN** the user types a non-empty query or clears the input while it remains focused
- **THEN** the dropdown shows note results for non-empty input and history for empty input

### Requirement: Delete search history
The application SHALL allow users to delete an individual quick-search history entry or clear all entries immediately without confirmation.

#### Scenario: Delete one entry
- **WHEN** the user activates an entry's delete control
- **THEN** only that entry is removed and no search is triggered

#### Scenario: Clear all entries
- **WHEN** the user activates the clear-all control
- **THEN** all entries are removed immediately and the empty history dropdown closes

### Requirement: Preserve accessible dropdown interaction
The application SHALL support Up, Down, Enter, and Escape navigation for both history and result modes and SHALL expose appropriate combobox and listbox accessibility state.

#### Scenario: Keyboard-select history
- **WHEN** the history dropdown is open and the user navigates with Up or Down and presses Enter
- **THEN** the highlighted history query is rerun

#### Scenario: Escape dropdown
- **WHEN** either dropdown mode is open and the user presses Escape
- **THEN** the dropdown closes before a subsequent Escape blurs the input
