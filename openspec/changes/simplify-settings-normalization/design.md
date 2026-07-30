## Context

`settings.service.ts` currently builds settings through several layers: defaults, partial-object spreading, feature-specific normalization, a logging normalization pass, and a load-only Knowledge Copilot migration. AI configuration is represented as `Record<string, unknown>`, so the compiler cannot ensure that the final persisted shape is complete. Load, save, and import also take slightly different paths.

Settings data enters Main from JSON files, imported packages, and Renderer IPC. It must therefore be treated as untrusted input, but the output consumed by the rest of the application should always be a complete, current `AppSettings` object.

## Goals / Non-Goals

**Goals:**

- Provide one authoritative `normalizeSettings(raw)` entry for every settings input path.
- Construct the final object explicitly so supported fields and defaults are visible in one place.
- Give AI Assistant and Knowledge Copilot concrete types.
- Keep nested domain normalization readable without chained default/incoming/merged objects.
- Remove obsolete schema migrations and compatibility field fallbacks.
- Reject non-object IPC save payloads and safely normalize malformed individual fields.
- Make adding a setting an intentional type/default/normalization change instead of another merge patch.

**Non-Goals:**

- Splitting native dialogs, startup configuration, or package I/O into new services.
- Changing current setting defaults or feature behavior.
- Preserving settings produced by historical Knowledge Agent or pre-v1 Knowledge Copilot schemas.
- Reworking the Renderer settings store beyond removing obsolete schema-version state.

## Decisions

1. **Use one public normalization entry with small pure domain helpers.** `normalizeSettings(raw: unknown): AppSettings` is the only function used by default creation, load, save, and import. Helpers such as AI source, sync, preview, and workbench normalizers accept raw values and return final typed values. This keeps one pipeline without creating one untestable giant function.

2. **Construct all top-level fields explicitly.** The normalizer does not spread the raw settings object into its result. Unknown and removed fields are dropped automatically, while each supported field visibly declares its fallback and normalization rule.

3. **Model current AI configuration explicitly.** `AiAssistantConfig` and `KnowledgeCopilotConfig` replace `Record<string, unknown>`. Their normalizers preserve current enablement semantics, validate compatible source selections, clamp numeric fields, and do not consult historical field names.

4. **Treat every external settings value as unknown.** File JSON, imported package settings, and IPC save payloads enter as `unknown`. The IPC handler validates that the payload is an object before calling the service; the service narrows nested values while constructing the current shape.

5. **Remove history-specific mutation.** The Knowledge Copilot schema version, `knowledgeAgent`, `chatSourceId`, `chatModel`, and obsolete index deletion migration are removed. No startup migration writes or filesystem deletions remain.

6. **Separate normalization from persistence side effects.** Normalization returns data only. Load/save/import decide whether to write, and the existing preview policy update remains after a final config has been produced.

## Risks / Trade-offs

- [Older settings fields are discarded] → This is intentional because the project has explicitly removed historical-user compatibility.
- [Explicit field construction requires updating the normalizer for every new setting] → Treat this as the desired compile-time review point and cover the current shape with tests.
- [Large rewrite may accidentally change defaults] → Compare Main defaults with Renderer defaults and add focused normalization tests before completing the change.
- [IPC callers can send malformed nested values] → Accept only object payloads at IPC and normalize every nested field before persistence.

## Migration Plan

1. Add explicit current configuration interfaces and the single normalizer.
2. Route default, load, save, and import through it.
3. Remove the obsolete migration and schema-version fields.
4. Validate the save payload at IPC.
5. Run focused tests plus Main, Renderer, lint, and production builds.

Rollback is a code rollback only; the new normalizer writes the same current settings shape minus explicitly obsolete historical fields.

## Open Questions

None.
