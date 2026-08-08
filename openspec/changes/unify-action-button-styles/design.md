## Context

Renderer features currently style standard action buttons locally, while settings already provides a reusable `.action-button` pattern and `base.css` provides icon-action and dialog-close patterns. Because `settings.css` is imported globally, the action styles are reusable in practice but are owned by the wrong stylesheet and are applied inconsistently.

## Goals / Non-Goals

**Goals:**

- Make semantic button hierarchy consistent across renderer features.
- Keep primary and secondary standard buttons visually neutral across accent themes while adapting to light and dark themes.
- Centralize shared visual and interaction states in `base.css`.
- Preserve component-specific layout without introducing a Vue wrapper component.

**Non-Goals:**

- Redesign navigation, menu, switch, window-control, color-picker, or clickable-card controls.
- Change button behavior, business logic, IPC, or user-visible copy.
- Introduce a general-purpose design-system package.

## Decisions

- Keep native `<button>` elements and apply shared CSS classes. This is the smallest change and avoids a cross-feature component dependency.
- Use `.action-button` as the structural base and neutral fallback, with explicit `.primary`, `.secondary`, and `.danger` modifiers for semantic intent.
- Use one primary button per action group; final commit/forward actions are primary, supporting actions are secondary, and destructive actions are danger.
- Give primary and secondary actions the same ordinary neutral button presentation. The primary modifier communicates semantic intent in templates but does not add a persistent accent fill.
- Render danger actions with danger-colored text and a soft danger background. Hover and active states retain danger semantics instead of switching to the accent color.
- Keep `.icon-action-button` and `.dialog-close-button` as specialized global classes. Icon actions are neutral at rest and use the accent on interaction; close buttons remain neutral.
- Remove only component-local visual declarations replaced by the shared classes. Width, placement, spacing, and other feature-specific layout remain local.

## Risks / Trade-offs

- Scoped component styles can override global classes → Remove overlapping visual declarations from each migrated standard action.
- A broad migration can accidentally restyle button-shaped navigation or cards → Limit migration to standard commands and retain the documented exclusions.
- Theme combinations can expose contrast issues → Use neutral theme tokens and manually verify the standard button states in light and dark modes.

## Migration Plan

1. Move the existing shared action-button rules from `settings.css` to `base.css` and add the danger and neutral icon states.
2. Apply semantic classes to standard actions across features and remove superseded local visual rules.
3. Run static verification and inspect representative screens in all theme combinations.

Rollback is limited to reverting the stylesheet relocation and template class migrations; no persisted data or public API is affected.

## Open Questions

None.
