## ADDED Requirements

### Requirement: Editor exposes explicit translation targets

The editor SHALL expose a Translation submenu inside Smart Writing when AI is enabled and text is selected.

#### Scenario: Translation menu is available

- **WHEN** AI is enabled and the editor has a non-empty selection
- **THEN** the context menu SHALL show Translation as a nested submenu inside Smart Writing
- **AND** it SHALL list exactly Simplified Chinese, English, Traditional Chinese (Taiwan), Japanese, and Korean
- **AND** it SHALL place the current interface language first when it is one of those targets

#### Scenario: Translation is unavailable

- **WHEN** AI is disabled or the editor has no selection
- **THEN** the editor SHALL NOT show the Translation submenu

#### Scenario: Another editor AI operation is active

- **WHEN** a pending, preview, or error editor AI operation is active
- **THEN** all translation target actions SHALL remain unavailable

### Requirement: Translation requests use a validated target language

The system SHALL accept translation targets only from the shared supported-language catalog and SHALL build translation prompts in Main.

#### Scenario: Valid translation request

- **WHEN** Renderer sends the translation prompt preset with a supported target language
- **THEN** Main SHALL construct an editor translation system prompt for that target
- **AND** it SHALL send the selected source text through the configured AI service

#### Scenario: Invalid translation request

- **WHEN** the translation preset omits the target or supplies an unsupported target
- **THEN** Main SHALL reject the request before calling the configured AI service

#### Scenario: Removed translation target is requested

- **WHEN** Renderer sends a target outside `zh-CN`, `en-US`, `zh-TW`, `ja-JP`, and `ko-KR`
- **THEN** Main SHALL reject the request before calling the configured AI service

### Requirement: Translation preserves document structure

The translation prompt SHALL require the model to preserve meaning, paragraphs, Markdown syntax, code, URLs, and proper nouns and return only translated text.

#### Scenario: Selected text contains Markdown or code

- **WHEN** the selected text contains Markdown markers, code, or URLs
- **THEN** the generated translation SHALL preserve those non-translatable structures

#### Scenario: Source already uses the target language

- **WHEN** the selected text is already written in the selected target language
- **THEN** the generated result SHALL preserve the source text without rewriting it

### Requirement: Translation uses the safe editor AI lifecycle

The editor SHALL preview translation results before replacing the originating source range.

#### Scenario: Translation starts

- **WHEN** the user chooses a target language
- **THEN** the editor SHALL show target-specific progress beside the source selection
- **AND** it SHALL suspend automatic writing completion

#### Scenario: User applies translation

- **WHEN** translation succeeds, the tracked source remains valid, and the user chooses Apply
- **THEN** the editor SHALL replace the tracked source range with the translation

#### Scenario: Translation cannot be applied safely

- **WHEN** the tracked source changes or the active note changes
- **THEN** the editor SHALL NOT replace text with the translation

#### Scenario: Translation fails

- **WHEN** the AI request fails
- **THEN** the editor SHALL preserve the original text and offer Retry and Close actions

### Requirement: Quick translation target is configurable

Smart Writing preferences SHALL let the user select one supported target language for quick translation and SHALL persist the selection in the existing assistant settings.

#### Scenario: User selects a quick translation target

- **WHEN** the user chooses a supported language in the Quick Translation dropdown
- **THEN** the system SHALL save that language as the quick translation target
- **AND** the dropdown SHALL display the selected language using its native label

#### Scenario: Existing configuration has no quick target

- **WHEN** a configuration without a quick translation target is loaded
- **THEN** Main SHALL use Simplified Chinese (`zh-CN`) as the quick translation target

#### Scenario: Quick target is invalid

- **WHEN** an imported or persisted quick translation target is not supported
- **THEN** Main SHALL replace it with Simplified Chinese (`zh-CN`)

#### Scenario: Quick translation is available

- **WHEN** AI is enabled and the editor has a non-empty selection
- **THEN** the context menu SHALL show a direct Translate to target-language action beside Smart Writing
- **AND** Smart Writing SHALL retain the full Translation submenu for choosing another language
- **AND** choosing the direct action SHALL use the configured target and the existing safe translation lifecycle
