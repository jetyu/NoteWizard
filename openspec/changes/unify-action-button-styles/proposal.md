## Why

Standard action buttons currently duplicate visual rules across renderer features, which makes equivalent actions use inconsistent colors, borders, and interaction states. Centralizing their semantic styles will make button hierarchy predictable and ensure primary actions follow the selected accent theme.

## What Changes

- Define shared primary, secondary, danger, icon-action, and dialog-close button styles in the global renderer base stylesheet.
- Migrate standard action buttons across renderer features to the shared semantic classes in one pass.
- Remove duplicated component-local visual rules while retaining feature-specific layout and sizing rules.
- Keep navigation items, menus, switches, window controls, color selectors, and clickable cards on their specialized styles.

## Capabilities

### New Capabilities

- `semantic-action-buttons`: Defines consistent semantic appearance and interaction states for standard renderer action buttons.

### Modified Capabilities

None.

## Impact

- Affects renderer templates and styles only, primarily `src/renderer/styles/base.css`, `src/renderer/styles/settings.css`, and Vue components containing standard actions.
- Does not change business logic, IPC, persisted settings, dependencies, or user-visible text.
