## 1. Shared Translation Contract

- [x] 1.1 Add the five-language target catalog, literal target type, runtime guard, and editor translation prompt preset
- [x] 1.2 Extend Renderer and Bridge AI generate payload types with the optional translation target

## 2. Main Prompt and Validation

- [x] 2.1 Require a supported target for translation preset requests at the Main IPC boundary
- [x] 2.2 Build localized translation prompts that preserve document structure and return only translated text

## 3. Editor Integration

- [x] 3.1 Add type-safe target-specific context-menu actions and nest Translation inside Smart Writing
- [x] 3.2 Order the current interface language first and disable translation targets during active AI operations
- [x] 3.3 Route translations through the existing selection-anchored preview, confirmation, retry, and suspension lifecycle
- [x] 3.4 Add Simplified Chinese context-menu text and target-aware operation labels

## 4. Verification

- [x] 4.1 Add unit tests for the target catalog, menu action parsing, ordering, prompt construction, and translation lifecycle configuration
- [x] 4.2 Run Renderer type checking, Main build, lint, unit tests, strict OpenSpec validation, and diff checks

## 5. Quick Translation Preference

- [x] 5.1 Persist and normalize a validated quick-translation target in Smart Writing settings
- [x] 5.2 Add the Quick Translation dropdown and direct Translate to target action while retaining the full language submenu
- [x] 5.3 Extend unit coverage and rerun Renderer type checking, Main build, lint, strict OpenSpec validation, and diff checks

## 6. Supported Language Reduction

- [x] 6.1 Restrict the shared translation capability to Simplified Chinese, English, Traditional Chinese (Taiwan), Japanese, and Korean
- [x] 6.2 Verify removed targets normalize or reject correctly and rerun all relevant checks
