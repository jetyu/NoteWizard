## 1. Remove License Runtime

- [x] 1.1 Remove Main license initialization, service, IPC handlers, channels, diagnostics, and feature checks
- [x] 1.2 Remove license APIs and event contracts from Preload and Renderer bridges
- [x] 1.3 Remove Renderer license feature, shell badge/dialog, menu entry, and feature-gate UI

## 2. Remove Official AI

- [x] 2.1 Remove official AI source constants, token resolution, and source-specific request behavior
- [x] 2.2 Change default and normalized AI settings to user-managed sources only
- [x] 2.3 Normalize user-managed source selections without legacy official-source compatibility

## 3. Verify Open Access

- [x] 3.1 Add focused regression coverage for license-free access and AI setting enablement
- [x] 3.2 Confirm no runtime license or official AI references remain outside intentional history/open-source licensing
- [x] 3.3 Run Main, Preload, Renderer, lint, language, unit-test, and production-build verification
