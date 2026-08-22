## Context

The Storage settings page already manages the workspace path, note history, trash retention, configuration transfer, SPPX transfer, and Markdown transfer. Manual SPPX export flushes renderer autosave and then asks the main process to ZIP the current workspace `Database` directory; SPPX import restores that same directory. Existing settings areas use an in-tab dashboard/subview pattern with the shared `settings-subview` content and footer styles.

Scheduled backup crosses Renderer → Preload/Bridge → Main. The renderer owns pending editor state and application-lifecycle scheduling, while the main process owns path validation, filesystem writes, SPPX package creation, and retention cleanup.

## Goals / Non-Goals

**Goals:**

- Add scheduled local backup without introducing a second backup format or restore path.
- Keep the Storage dashboard readable by placing the detailed controls on an existing-style second-level page.
- Persist safe defaults for existing installations and validate all configuration values.
- Create a backup from flushed note data, avoid overlapping runs, and retain only the configured number of scheduled packages.
- Keep manual SPPX export as the only on-demand backup action.

**Non-Goals:**

- Background backup while Snaptium is not running.
- A new restore browser, backup-now button, OS task scheduler, cloud upload, or backup encryption format.
- Backing up preferences, AI credentials, generated knowledge indexes, or machine-bound auto-unlock data.
- Changing the existing SPPX import replacement and rollback behavior.

## Decisions

- Store scheduled-backup configuration under `noteStorage.scheduledBackup` with `enabled`, `directoryPath`, `intervalHours`, `retentionCount`, and `lastBackupAt`. Defaults are disabled, no directory, 2 hours, 10 files, and no successful backup. Shared constants define the allowed interval and retention values for both main and renderer code.
- Add a single Scheduled Backup navigation card to the Storage dashboard. It shows enabled/disabled state and the latest successful backup summary, and opens a child component inside the same settings tab. The child uses the shared setting-card, switch, select, subview-content, and footer/back-button patterns already used by other settings subviews. Settings persist immediately; the footer contains only Back.
- Do not add a backup-now action. The existing manual SPPX export remains the user-initiated path.
- Extract reusable SPPX package creation and filename generation from the dialog-driven export. Manual export chooses a destination and calls the shared creator; scheduled backup generates a destination and calls the same creator. Both packages remain importable through the unchanged SPPX import workflow.
- Correct the manual generated filename prefix from `SnaptiumBakcup` to `SnaptiumBackup`, and use the scheduled-only `SnaptiumScheduledBackup-YYYYMMDD-HHmmss.sppx` prefix for scheduled files. Both call the same formatter and package creator, while the distinct scheduled prefix lets retention prove ownership and avoid deleting manual exports.
- Schedule in a renderer lifecycle composable because the renderer can await `forceFlushAutoSave()` before invoking the main process. It checks immediately after settings and workspace initialization, then checks at the selected interval while the app remains running. A missing `lastBackupAt` is due immediately, so enabling backup creates the first package without a separate button.
- Expose one typed IPC operation that receives the selected directory and retention count. The IPC handler validates the payload with Zod. The main service resolves the current workspace, rejects a destination inside that workspace, creates the target directory, writes the SPPX package, prunes older matching packages after success, and returns the successful timestamp/path.
- Keep one in-flight promise in the renderer scheduler and one in-flight guard in the main backup service. Duplicate timer/config triggers reuse or skip the active operation instead of producing overlapping archives.
- Update `lastBackupAt` only after package creation succeeds. A failure is logged and leaves the previous successful time unchanged so the next lifecycle check still treats the backup as overdue.

## Risks / Trade-offs

- [Snaptium must be running for scheduling] → State this in the setting description and perform an overdue check at startup rather than implying an OS-level scheduler.
- [A destination can be removed, become read-only, or run out of space] → Fail without changing `lastBackupAt` or deleting older packages; log the normalized error for diagnosis.
- [A backup directory inside the workspace can create recursion or couple backup loss to workspace loss] → Reject equal or descendant workspace paths in the main process.
- [Frequent archives can consume substantial disk space] → Offer explicit retention choices and prune only strict scheduled-backup filenames after a successful package is finalized.
- [Correcting the filename typo changes the default name of new manual exports] → Existing files remain valid and importable because restoration depends on SPPX contents and extension, not the filename.

## Migration Plan

- Existing preferences without `noteStorage.scheduledBackup` normalize to the disabled default configuration without reading prior experimental keys.
- Existing `.sppx` and `.nwp` packages remain importable; no package migration is required.
- Rollback ignores the additional settings object and leaves generated SPPX files as ordinary restorable packages.

## Open Questions

None.
