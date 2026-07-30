## Why

Main-process settings handling has accumulated layered default merging, feature-specific migrations, and follow-up normalization passes. The resulting `defaultConfig` / `incomingConfig` / `mergedConfig` flow is difficult to reason about and makes every new setting look like another compatibility patch.

## What Changes

- Introduce one authoritative `normalizeSettings(raw)` entry that explicitly constructs a complete settings object.
- Route settings load, save, import, reset, and default creation through the same normalization contract.
- Replace untyped AI Assistant and Knowledge Copilot records with explicit configuration interfaces.
- Keep small domain normalizers for nested settings, but remove nested default/incoming/merged patch chains.
- Validate settings input as untrusted data at the Main/IPC boundary.
- **BREAKING** Remove Knowledge Copilot schema-version migration, legacy chat-field fallbacks, and obsolete index cleanup because historical configuration compatibility is out of scope.
- Preserve current defaults and current user-managed configuration behavior.

## Capabilities

### New Capabilities

- `settings-normalization`: Defines a single, explicit, typed normalization path for all persisted and imported application settings.

### Modified Capabilities

None.

## Impact

- `electron/main/services/settings.service.ts`
- `electron/main/ipc/modules/settings.ts`
- Renderer settings types/defaults where obsolete schema-version fields are removed
- Settings load, save, import, reset, and configuration-package handling
- Focused settings normalization tests and Main/Renderer verification
