## ADDED Requirements

### Requirement: Export all current application logs
The system SHALL export every top-level regular file with a `.log` extension currently present in the Snaptium log directory, preserving each selected file's name and byte content without redaction, filtering, or truncation.

#### Scenario: Log files are available
- **WHEN** the user confirms a diagnostic package save path
- **THEN** the ZIP contains every current top-level regular `.log` file with unchanged bytes

#### Scenario: Non-log entries are present
- **WHEN** the log directory also contains non-log files, directories, or special entries
- **THEN** the ZIP excludes those entries

#### Scenario: No log files are available
- **WHEN** the user confirms export while the log directory contains no eligible log files
- **THEN** the system creates a valid empty diagnostic ZIP and reports zero included log files

### Requirement: Keep diagnostic export local
The system SHALL generate the diagnostic ZIP locally at a save path selected through the main-process native dialog and SHALL NOT upload the package.

#### Scenario: User confirms export
- **WHEN** the user selects a destination in the save dialog
- **THEN** the main process creates the ZIP at that destination without renderer-provided filesystem input or network activity

#### Scenario: User cancels export
- **WHEN** the user cancels the save dialog
- **THEN** the system returns a cancelled result without creating an archive or temporary export data

### Requirement: Clean export resources
The system SHALL remove temporary staging data after success or failure and SHALL return a typed failure result when export cannot complete.

#### Scenario: ZIP creation succeeds
- **WHEN** the package is created successfully
- **THEN** the system returns the archive path and included log count and removes staging data

#### Scenario: ZIP creation fails
- **WHEN** copying or archive creation fails
- **THEN** the system returns a failure result and removes staging data and any partial archive created by that export

### Requirement: Present matching log actions
The Log settings page SHALL present "Export diagnostic package" and "Open log folder" with the same action-button visual style and SHALL prevent duplicate export actions while one export is active.

#### Scenario: User starts an export
- **WHEN** the user activates "Export diagnostic package"
- **THEN** the button shows a busy state, remains in the standard action-button style, and duplicate activation is disabled

#### Scenario: Export description
- **WHEN** the user views the diagnostic export setting
- **THEN** the description states that the current logs are packaged for troubleshooting
