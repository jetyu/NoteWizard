## Why

Editor smart-writing actions currently close the native context menu and remain silent until the AI request finishes, so users cannot tell whether rewriting, expanding, simplifying, or summarizing is still running. The result also replaces the current selection rather than the selection that initiated the request, creating a risk of modifying the wrong text after the user moves the cursor or continues editing.

## What Changes

- Show an indeterminate, action-specific progress card beside the originating editor selection while a smart-writing request is running.
- Preserve and track the originating selection independently from the current cursor position.
- Present generated text in the same floating card and require the user to apply or discard it.
- Allow unrelated document edits while preventing a result from replacing a changed source range or a different note.
- Show inline failure feedback with retry and close actions.
- Limit each editor to one active smart-writing operation and disable additional smart-writing menu actions until it finishes.
- Suspend automatic writing completion for the full lifetime of a smart-writing operation and restore it after the operation closes.

## Capabilities

### New Capabilities

- `editor-ai-operation-feedback`: Selection-anchored progress, safe result preview, confirmation, and failure recovery for editor smart-writing actions.

### Modified Capabilities

None.

## Impact

- Editor context-menu orchestration and menu item enabled state.
- CodeMirror editor extension state for tracking and decorating the source range.
- Editor pane UI and Simplified Chinese locale strings.
- Renderer-only behavior; no new IPC channel, preload API, Main-process change, or dependency.
