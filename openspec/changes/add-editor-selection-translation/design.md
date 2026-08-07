## Context

The editor context menu already starts typed AI operations and presents their results in a safe selection-anchored card. Editor prompts are resolved in Main from validated shared presets, while the native context menu returns string action IDs. Translation must supply a validated target language without moving prompt construction into Renderer. Smart Writing preferences already persist other assistant behavior and can hold one quick-translation target.

## Goals / Non-Goals

**Goals:**

- Offer an explicit target-language submenu inside Smart Writing.
- Offer a configurable direct translation action for the user's preferred target language.
- Support exactly five targets: `zh-CN`, `en-US`, `zh-TW`, `ja-JP`, and `ko-KR`.
- Keep translation prompt construction and target validation in Main.
- Reuse existing progress, preview, confirmation, retry, source validation, and completion suspension.

**Non-Goals:**

- Automatic target-language inference.
- A recent translation-language preference.
- Streaming translation, batch translation, or whole-note translation.
- Translation-specific insertion or clipboard modes.

## Decisions

### Represent translation targets in shared AI constants

A readonly locale catalog will define the five valid target codes, native menu labels, and localized prompt names. It will expose a literal union type plus a runtime guard so Renderer action parsing and Main IPC validation use one source of truth.

This avoids accepting arbitrary prompt text from Renderer and avoids coupling Main to Renderer locale configuration.

### Encode the target in the native menu action ID

Translation items will use typed action IDs shaped as `aiTranslate:<locale>`. Renderer will parse and validate the suffix before starting an operation. The current interface locale is ordered first, followed by a stable shared priority order.

Translation is nested under Smart Writing so all selection-based AI editing operations remain grouped together. The native editor-menu builder and Renderer payload mapping recursively preserve nested submenu items.

### Persist one quick-translation target

The existing `aiAssistant` settings object will store one validated `quickTranslationTarget`. Smart Writing preferences will present the shared five-language catalog as a native-label dropdown. When a configuration lacks the field or contains an invalid or removed target, Main normalization will use Simplified Chinese (`zh-CN`).

The editor context menu will show a direct `Translate to <language>` action beside Smart Writing, while the full Translation submenu remains inside Smart Writing. Both actions encode the target with the same typed action ID and use the same safe operation lifecycle.

### Extend the existing generate payload

`AI_PROMPT_PRESETS` will add `editor-translate`, and the existing AI generate payload will add an optional typed `targetLanguage`. Main will require a valid target whenever the translation preset is used and pass it into editor prompt construction. No new IPC channel is needed.

### Reuse the editor AI operation lifecycle

Translation will create the same operation state used by rewrite, expand, simplify, and summarize, adding only the target locale and native display label needed for the card title. Apply replaces the mapped source range; all existing invalidation, retry, note-switch, and automatic-completion rules remain unchanged.

## Risks / Trade-offs

- **Removing previously selectable targets can invalidate persisted settings.** → Keep the five-language catalog centralized and normalize removed targets to Simplified Chinese.
- **Models may alter Markdown or code while translating.** → Include explicit preservation rules and return-only-text constraints in both prompt languages.
- **A third menu level requires more pointer travel.** → Keep translation grouped under Smart Writing, put the current interface language first, and keep the remaining order stable.
- **A persisted target can become invalid after configuration import.** → Normalize it against the shared target catalog at the Main settings boundary.
- **The source may already match the target language.** → Instruct the model to return the original text unchanged.

## Migration Plan

No explicit data migration is required. Existing configurations receive a normalized quick target when loaded; removed targets fall back to Simplified Chinese and save through the existing settings flow. Rollback removes the translation preset, quick-target field, menu actions, and prompt branch without affecting existing editor operations.

## Open Questions

None.
