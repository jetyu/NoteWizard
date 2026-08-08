## 1. Settings Model

- [x] 1.1 Add the persisted rebuild concurrency setting, default, constraints, and Renderer/Main normalization.
- [x] 1.2 Clamp and persist concurrency when the embedding source changes to Snaptium AI.

## 2. Index Settings UI

- [x] 2.1 Add the numeric concurrency dropdown with provider-aware options and localized copy.

## 3. Rebuild Scheduling

- [x] 3.1 Resolve the effective provider-aware concurrency when rebuilding and use it for index workers.
- [x] 3.2 Serialize vector-store mutations while keeping embedding generation concurrent.

## 4. Verification

- [x] 4.1 Validate the OpenSpec change and run focused TypeScript, Main build, and lint checks.
