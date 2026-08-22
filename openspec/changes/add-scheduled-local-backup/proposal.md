## Why

Snaptium users can create manual SPPX packages, but they currently have no protection against forgetting to export before local data loss or corruption. Scheduled local backup should periodically preserve the same restorable Database package in a user-selected directory while the application is running.

## What Changes

- Add a Scheduled Backup entry under Preferences → Storage that opens a second-level settings page consistent with existing settings subviews.
- Let users enable or disable scheduled backup, choose a destination directory, select every 1, 2, 6, or 12 hours or daily, and retain the newest 5, 10, 20, 30, or 100 backups.
- Display the most recent successful backup time on the scheduled-backup page and summarize the configured state on the Storage dashboard.
- Reuse the existing SPPX Database packaging and SPPX restore path for both manual exports and scheduled backups; do not add a second package format or a duplicate restore workflow.
- Run one overdue backup after application startup and prevent overlapping backup runs.
- Retain only scheduled Snaptium backup files and never delete unrelated files from the selected directory.
- Keep the existing manual SPPX export as the explicit on-demand backup action; do not add a separate "Back up now" button.

## Capabilities

### New Capabilities

- `scheduled-local-backup`: Scheduled local SPPX backups, retention, status persistence, and the Storage second-level settings experience.

### Modified Capabilities

None.

## Impact

- Main process: reusable SPPX package creation, scheduled-backup execution, destination validation, retention cleanup, and logging.
- IPC/preload/renderer bridge: a typed scheduled-backup operation.
- Renderer: settings model/store/service changes, application-lifecycle scheduling, and a Storage second-level page matching existing UI patterns.
- Simplified Chinese locale strings and focused unit tests.
- No new dependencies, no new backup format, and no network activity.
