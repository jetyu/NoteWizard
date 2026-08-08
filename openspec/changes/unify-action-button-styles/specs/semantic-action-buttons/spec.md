## ADDED Requirements

### Requirement: Standard actions expose a consistent semantic hierarchy
The renderer SHALL style standard action buttons through shared primary, secondary, or danger semantic classes. Each action group SHALL contain no more than one primary action.

#### Scenario: Final action in an action group
- **WHEN** an action commits a change or advances the user through the current flow
- **THEN** it is presented as the theme-colored primary action
- **AND** supporting actions in the same group use the neutral secondary style

#### Scenario: Destructive action
- **WHEN** an action deletes, permanently removes, or clears user-managed content
- **THEN** it uses the soft danger style
- **AND** its hover and active states retain danger semantics

### Requirement: Shared action styles follow application themes
Shared standard action styles MUST derive visual colors from global theme tokens and MUST provide hover, active, focus-visible, and disabled states.

#### Scenario: Accent theme changes
- **WHEN** the user changes the configured accent theme
- **THEN** primary actions and interactive accent states update to the selected accent
- **AND** primary action text uses the matching accent-solid text token

#### Scenario: Light or dark theme changes
- **WHEN** the application changes between light and dark themes
- **THEN** secondary and icon actions use the appropriate neutral surface and text tokens

### Requirement: Specialized controls retain specialized presentation
The renderer SHALL NOT apply standard action-button presentation to navigation items, menu items, switches, window controls, color selectors, or clickable cards solely because they use a native button element.

#### Scenario: Button element represents a specialized control
- **WHEN** a native button acts as navigation, a menu option, a switch, a window control, a color selector, or a clickable card
- **THEN** it retains its specialized control styles
