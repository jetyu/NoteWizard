## 1. Remove License Runtime

- [x] 1.1 Remove Main license initialization, service, IPC handlers, channels, diagnostics, and feature checks
- [x] 1.2 Remove license APIs and event contracts from Preload and Renderer bridges
- [x] 1.3 Remove Renderer license feature, shell badge/dialog, menu entry, and feature-gate UI

## 2. Remove Official AI

- [x] 2.1 Remove official AI source constants, token resolution, and source-specific request behavior
- [x] 2.2 Change default and normalized AI settings to user-managed sources only
- [x] 2.3 Migrate legacy official source records and selections without changing valid custom configuration

## 3. Verify Open Access

- [ ] 3.1 Add focused tests for license-free access and legacy AI settings migration
- [ ] 3.2 Confirm no runtime license or official AI references remain outside intentional history/open-source licensing
- [ ] 3.3 Run Main, Preload, Renderer, lint, language, unit-test, and production-build verification
