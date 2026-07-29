## 1. Electron Boundary

- [x] 1.1 Define the typed diagnostic export result and centralized no-input IPC channel.
- [x] 1.2 Expose diagnostic export through preload, renderer declarations, and the renderer bridge.
- [x] 1.3 Organize main-process log services under `services/log/` and relocate the shared ZIP helper to `main/utils/`.

## 2. Raw Log Package

- [x] 2.1 Implement main-process selection and byte-for-byte staging of every top-level regular `.log` file.
- [x] 2.2 Implement the save dialog, ZIP creation, success/cancellation/failure results, and temporary/partial-file cleanup.
- [x] 2.3 Register the main-process diagnostic export IPC handler.

## 3. Settings Experience

- [x] 3.1 Add settings service/store orchestration with duplicate-export protection.
- [x] 3.2 Add the export action using the same button style as the existing log-folder action, with localized feedback and a troubleshooting description.

## 4. Verification

- [x] 4.1 Add unit tests for complete raw-file selection, byte preservation, exclusion rules, empty export, cancellation, failure, and cleanup.
- [x] 4.2 Run relevant unit, main, preload, renderer type, lint, and locale verification commands.
- [x] 4.3 Strictly validate the completed OpenSpec change.
