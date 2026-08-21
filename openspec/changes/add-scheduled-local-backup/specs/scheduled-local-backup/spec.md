## ADDED Requirements

### Requirement: Scheduled backup settings subview
The system SHALL expose scheduled local backup from a navigation card on Preferences → Storage and SHALL present its detailed controls in a second-level page that follows the existing settings subview layout and interaction styles.

#### Scenario: Open scheduled backup settings
- **WHEN** the user activates the Scheduled Backup card on the Storage dashboard
- **THEN** the system displays the scheduled-backup second-level page with enablement, directory, frequency, retention, and latest-success controls
- **AND** the page provides the same footer Back interaction used by existing immediately persisted settings subviews

#### Scenario: Manual backup remains distinct
- **WHEN** the user views either the Storage dashboard or scheduled-backup subview
- **THEN** the system does not display a separate backup-now action
- **AND** the existing manual SPPX export remains available as the on-demand backup path

### Requirement: Scheduled backup configuration
The system SHALL persist whether scheduled backup is enabled, the user-selected directory, an allowed interval of 1, 2, 6, 12, or 24 hours, an allowed retention count of 5, 10, 20, 30, or 100 files, and the latest successful backup timestamp.

#### Scenario: Existing settings are normalized
- **WHEN** preferences do not contain valid scheduled-backup configuration
- **THEN** the system uses disabled, no directory, 2 hours, 10 retained files, and no latest-success timestamp

#### Scenario: Enable without an existing directory
- **WHEN** the user enables scheduled backup before choosing a destination
- **THEN** the system opens the existing directory chooser
- **AND** it enables scheduled backup only if a directory is selected

#### Scenario: Disable scheduled backup
- **WHEN** the user disables scheduled backup
- **THEN** the system stops scheduling backups while retaining the selected directory, frequency, retention, and latest-success values

### Requirement: Scheduled SPPX creation
While Snaptium is running, the system SHALL create scheduled backups when the latest successful backup is absent or older than the configured interval, SHALL flush pending editor autosave first, and SHALL prevent overlapping runs.

#### Scenario: First backup after enabling
- **WHEN** scheduled backup becomes enabled with a valid directory and no successful backup timestamp
- **THEN** the system flushes pending editor content and creates one scheduled SPPX package

#### Scenario: Overdue backup at startup
- **WHEN** Snaptium starts with scheduled backup enabled and the configured interval has elapsed
- **THEN** the system creates one backup after settings and workspace initialization
- **AND** it does not create multiple catch-up backups for missed intervals

#### Scenario: Backup not due
- **WHEN** the latest successful backup is newer than the configured interval
- **THEN** a lifecycle check does not create another package

#### Scenario: Backup fails
- **WHEN** package creation or destination access fails
- **THEN** the system leaves the previous latest-success timestamp unchanged
- **AND** it does not prune retained packages

### Requirement: Shared SPPX package and restore flow
The system SHALL use the same Database-to-SPPX package creator for manual export and scheduled backup, and scheduled packages SHALL remain restorable through the existing SPPX import workflow.

#### Scenario: Scheduled package contents
- **WHEN** a scheduled backup succeeds
- **THEN** the package contains the workspace `Database` directory using the existing SPPX archive structure
- **AND** the existing SPPX importer accepts it without a separate restore implementation

#### Scenario: Generated package name
- **WHEN** the system generates a default manual or scheduled package name
- **THEN** a manual export defaults to `SnaptiumBackup-YYYYMMDD-HHmmss.sppx`
- **AND** a scheduled backup uses `SnaptiumScheduledBackup-YYYYMMDD-HHmmss.sppx`

### Requirement: Safe destination and retention
The main process SHALL validate scheduled-backup inputs, reject a destination equal to or inside the active workspace, and remove only excess scheduled packages matching the strict Snaptium generated filename pattern after a successful backup.

#### Scenario: Destination inside workspace
- **WHEN** a scheduled backup targets the workspace or one of its descendants
- **THEN** the main process rejects the operation without creating or removing a package

#### Scenario: Retention limit exceeded
- **WHEN** a successful scheduled backup causes matching packages to exceed the configured retention count
- **THEN** the system removes the oldest matching packages until the count equals the configured limit
- **AND** leaves unrelated files and manually named SPPX packages untouched

### Requirement: Latest backup presentation
The scheduled-backup subview SHALL display the localized date and time of the latest successful backup, or a localized never-backed-up state when no success is recorded.

#### Scenario: Successful backup status
- **WHEN** a scheduled package is created successfully
- **THEN** the system persists its completion timestamp
- **AND** the Storage dashboard summary and scheduled-backup page reflect the latest successful backup
