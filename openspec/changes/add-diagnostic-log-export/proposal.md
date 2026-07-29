## Why

Opening the log folder requires users to locate and package files manually before sharing them for troubleshooting. Snaptium should provide a one-click local export that bundles every log file currently retained by the application without changing its contents.

## What Changes

- Add an "Export diagnostic package" action to Log settings using the same button style as "Open log folder".
- Export every regular `.log` file currently present in Snaptium's log directory into a ZIP archive chosen by the user.
- Preserve log file contents exactly; do not redact, filter, truncate, or upload them.
- Keep the existing "Open log folder" action.
- Report export success, cancellation, or failure through the existing Electron bridge.

## Capabilities

### New Capabilities

- `diagnostic-log-export`: Local ZIP export of all currently retained raw application log files.

### Modified Capabilities

None.

## Impact

- Main process: a dedicated log-service folder, log directory access, save dialog, temporary staging, ZIP creation, and cleanup.
- IPC/preload/renderer bridge: one no-input export operation and a typed result.
- Renderer settings UI/store/service: export action, busy state, and result feedback.
- Simplified Chinese locale strings and unit tests.
- No new dependencies and no network activity.
