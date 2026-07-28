## Context

Snaptium writes daily `.log` files into a flat `userData/logs` directory and currently exposes only an action that opens this directory. The new export crosses Renderer → Preload/Bridge → Main because the main process must enumerate log files, show a native save dialog, create the ZIP, and clean up temporary data.

The requested package contains raw logs. Contents must be copied unchanged and the package remains local until the user chooses to share it.

## Goals / Non-Goals

**Goals:**

- Export every regular `.log` file currently present in the Snaptium log directory.
- Preserve each selected file's name and bytes exactly.
- Use the same visual button style as the existing log-folder action.
- Keep export local and clean temporary data on success, cancellation, and failure.
- Reuse the existing ZIP implementation without adding a dependency.

**Non-Goals:**

- Redaction, filtering, truncation, retention changes, or content inspection.
- Automatic upload, telemetry, or a live log viewer.
- Exporting non-log files, nested directories, settings, notes, or databases.

## Decisions

- Add a no-input `LOGGER_EXPORT_DIAGNOSTICS` IPC operation with a typed exported/cancelled/failed result. The renderer does not provide filesystem paths or export options.
- Implement export in a main-process service. It shows the save dialog first, copies top-level regular `.log` files into a unique temporary staging directory, ZIPs that directory, and removes staging in `finally`.
- Copy log files byte-for-byte with `fs.copyFile`; no text decoding or sanitization occurs.
- Group the main-process logger and diagnostic export service under `services/log/`, while keeping logger IPC in `ipc/modules` to preserve layer boundaries.
- Move the ZIP helper to `main/utils/zip.utils.ts` because both the log domain and data import/export workflows consume it.
- Generate `Snaptium-diagnostic-logs-YYYYMMDD-HHmmss.zip`. The archive contains one root directory with all selected log files directly beneath it.
- An empty log directory still produces a valid empty archive and reports zero included files.
- Keep both settings actions as ordinary `action-button` controls; only the temporary disabled/busy state differs during export.

## Risks / Trade-offs

- [Raw logs may contain sensitive values, local paths, or user-controlled context] → Keep export local, require an explicit save action, and never upload automatically.
- [Retained logs can be large] → Export all files as requested and stage them sequentially; do not impose an undocumented cap.
- [A log may change while being copied] → Package the completed staged snapshot and fail cleanly if a file cannot be copied.
- [ZIP creation can leave partial output] → Remove a destination created by the current export when ZIP creation fails, and always remove the unique staging directory.
