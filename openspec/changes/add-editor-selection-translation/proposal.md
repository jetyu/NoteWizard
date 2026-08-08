## Why

Editor smart-writing can rewrite selected text but cannot translate it, forcing users to leave the note or construct a manual AI prompt. Translation also needs an explicit target language so the result is predictable without requiring a hidden preference.

## What Changes

- Add a Translation submenu inside Smart Writing for translating selected text into Simplified Chinese, English, Traditional Chinese (Taiwan), Japanese, or Korean.
- Add a persisted Quick Translation target selector to Smart Writing preferences and expose that target as a direct context-menu action.
- Default Quick Translation to Simplified Chinese for new, legacy, reset, or invalid configurations.
- Put the current interface language first, followed by a stable common-language order.
- Reuse the existing selection-anchored progress, preview, apply, discard, retry, source-validation, and automatic-completion suspension flow.
- Add a built-in editor translation prompt that preserves meaning, paragraphs, Markdown syntax, code, URLs, and proper nouns while returning only translated text.
- Validate the requested translation target at the Main IPC boundary.
- Reject every translation target outside the fixed five-language catalog.
- Do not add recent-language state or translation-specific output-mode settings.

## Capabilities

### New Capabilities

- `editor-selection-translation`: Explicit target-language translation of editor selections with safe preview and replacement.

### Modified Capabilities

None.

## Impact

- Shared AI prompt preset and translation-target types.
- Renderer settings state, AI request payload, editor context-menu actions, and operation labels.
- Main AI chat validation and editor prompt construction.
- Simplified Chinese context-menu text and unit tests.
- No new IPC channel or dependency; existing settings persistence gains one validated field.
