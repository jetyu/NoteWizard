## 1. Define Current Settings Model

- [x] 1.1 Replace untyped AI configuration records with explicit Main-process interfaces
- [x] 1.2 Remove Knowledge Copilot schema-version and legacy input fields from Main and Renderer models

## 2. Implement One Normalization Pipeline

- [x] 2.1 Implement `normalizeSettings(raw)` with explicit top-level field construction and current defaults
- [x] 2.2 Refactor nested AI, preview, sync, workbench, logging, shell, and access-control normalization to return final typed values
- [x] 2.3 Route default creation, load, save, import, and reset through the authoritative normalizer
- [x] 2.4 Remove historical Knowledge Copilot migration, legacy chat fallbacks, and obsolete index cleanup

## 3. Harden Boundaries and Verify

- [x] 3.1 Validate settings-save IPC input as an object before calling the settings service
- [x] 3.2 Add focused tests for defaults, malformed input, unknown-field removal, AI enablement, and IPC payload validation
- [x] 3.3 Run OpenSpec validation, Main build, Renderer typecheck, lint, unit tests, and production build
