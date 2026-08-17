## 1. View continuity

- [x] 1.1 Cache `SearchView` across main-view navigation without changing the mounting behavior of other views.
- [x] 1.2 Separate Search view activation/deactivation listener handling from final component unmount cleanup.

## 2. Ask behavior verification

- [x] 2.1 Verify pending Ask dispatch, streaming stages, partial output, and final persistence survive view navigation.
- [x] 2.2 Verify returning during and after generation renders the original conversation without the false empty-result state.

## 3. Validation

- [x] 3.1 Assess focused automated coverage; the repository has no Vue component test harness, so cover the lifecycle through renderer compilation and manual acceptance steps.
- [x] 3.2 Run renderer typecheck, lint, relevant tests, and strict OpenSpec validation.
