## 1. Configuration and Electron Boundary

- [x] 1.1 Add shared scheduled-backup constants/types and normalize safe defaults in main and renderer settings models.
- [x] 1.2 Add the typed scheduled-backup IPC operation across centralized channels, handler validation, preload exposure, renderer declaration, and bridge.

## 2. Shared SPPX Backup Execution

- [x] 2.1 Refactor SPPX export so dialog-driven manual export and path-driven scheduled backup use the same package creator and generated filename helper.
- [x] 2.2 Implement main-process scheduled backup destination validation, single-flight execution, strict retention cleanup, logging, and typed results.

## 3. Scheduling and Settings Experience

- [x] 3.1 Add renderer backup orchestration that flushes autosave, checks whether backup is due, prevents overlap, invokes the bridge, and persists the latest successful timestamp.
- [x] 3.2 Add the Storage dashboard navigation card and scheduled-backup second-level page using the existing settings subview, controls, footer, and responsive styles without a backup-now button.
- [x] 3.3 Add Simplified Chinese localization for the scheduled-backup dashboard, controls, options, summaries, and errors.

## 4. Verification

- [x] 4.1 Add focused unit tests for configuration normalization, due-time behavior, safe destination validation, generated naming, and retention selection.
- [x] 4.2 Run relevant unit tests, main/preload builds, renderer typecheck, lint, and locale validation.
- [x] 4.3 Strictly validate the completed OpenSpec change.
