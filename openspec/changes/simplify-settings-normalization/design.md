## Context

`settings.service.ts` currently builds settings through several layers: defaults, partial-object spreading, feature-specific normalization, a logging normalization pass, and a load-only Knowledge Copilot migration. AI configuration is represented as `Record<string, unknown>`, so the compiler cannot ensure that the final persisted shape is complete. Load, save, and import also take slightly different paths.

Settings data enters Main from JSON files, imported packages, and Renderer IPC. It must therefore be treated as untrusted input, but the output consumed by the rest of the application should always be a complete, current `AppSettings` object.

## Goals / Non-Goals

**Goals:**

- Provide one authoritative `normalizeSettings(raw)` entry for every settings input path.
- Construct the final object from one normalizer per settings Tab so the root only describes module composition.
- Give AI Assistant and Knowledge Copilot concrete types.
- Keep nested domain normalization readable without chained default/incoming/merged objects.
- Remove obsolete schema migrations and compatibility field fallbacks.
- Reject non-object IPC save payloads and safely normalize malformed individual fields.
- Make adding a setting an intentional type/default/normalization change instead of another merge patch.

**Non-Goals:**

- Splitting native dialogs, startup configuration, or package I/O into new services.
- Changing current setting defaults or feature behavior.
- Preserving settings produced by historical Knowledge Agent or pre-v1 Knowledge Copilot schemas.
- Reworking features unrelated to the settings shape or settings-store API.

## Decisions

1. **Use one public normalization entry with one config method per settings module.** `normalizeSettings(raw: unknown): AppSettings` is the only function used by default creation, load, save, and import. `normalizeGeneralConfig`, `normalizeEditorConfig`, `normalizePreviewConfig`, and the remaining feature config methods each accept only their own raw module and return one final typed config.

2. **Keep the root grouped and explicit.** The normalizer returns module keys such as `general`, `editor`, `preview`, `aiSources`, `noteStorage`, `privacyLog`, and `softwareUpdate`; it does not spread raw settings or list unrelated leaf fields at the root. Unknown, flat historical, and removed fields are dropped automatically.

3. **Model current AI configuration explicitly.** `AiAssistantConfig` and `KnowledgeCopilotConfig` replace `Record<string, unknown>`. Their normalizers preserve current enablement semantics, validate compatible source selections, clamp numeric fields, and do not consult historical field names.

4. **Treat every external settings value as unknown.** File JSON, imported package settings, and IPC save payloads enter as `unknown`. The IPC handler validates that the payload is an object before calling the service; the service narrows nested values while constructing the current shape.

5. **Remove history-specific mutation.** The Knowledge Copilot schema version, `knowledgeAgent`, `chatSourceId`, `chatModel`, and obsolete index deletion migration are removed. No startup migration writes or filesystem deletions remain.

6. **Separate normalization from persistence side effects.** Normalization returns data only. Load/save/import decide whether to write, and the existing preview policy update remains after a final config has been produced.

7. **Expose Renderer actions by config module.** The settings store keeps `config` as the state root, exposes load/save/import/reset under `persistence`, and groups feature actions under matching modules such as `general`, `editor`, `aiSources`, `sync`, and `privacyLog`.

## Risks / Trade-offs

- [Older settings fields are discarded] → This is intentional because the project has explicitly removed historical-user compatibility.
- [Explicit field construction requires updating the normalizer for every new setting] → Treat this as the desired compile-time review point and cover the current shape with tests.
- [Large rewrite may accidentally change defaults] → Compare Main defaults with Renderer defaults and add focused normalization tests before completing the change.
- [IPC callers can send malformed nested values] → Accept only object payloads at IPC and normalize every nested field before persistence.

## Migration Plan

1. Add explicit per-module configuration interfaces and normalizers.
2. Route default, load, save, and import through it.
3. Remove the obsolete migration and schema-version fields.
4. Validate the save payload at IPC.
5. Migrate Renderer consumers to the grouped shape and module-grouped store API.
6. Run focused tests plus Main, Renderer, lint, and production builds.

Rollback is a code rollback only. The grouped settings shape is intentionally breaking; flat historical settings are not migrated.

## Open Questions

None.
