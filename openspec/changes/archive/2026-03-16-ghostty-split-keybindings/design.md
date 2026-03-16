## Context

The Ghostty config at `dot_config/ghostty/config` already has tab keybindings (`super+t`, `super+w`, `super+shift+arrow`, `super+1..5`) and supporting settings (`split-inherit-working-directory = true`, `confirm-close-surface = true`). Split functionality is available but has no custom keybindings — users must use Ghostty defaults or the mouse.

The existing modifier pattern:

- `super+key` — direct actions (new tab, close surface)
- `super+shift+key` — tab management (prev/next tab)

## Goals / Non-Goals

**Goals:**

- Full keyboard-driven split workflow: create, navigate, resize, zoom, equalize
- Consistent modifier pattern that extends the existing keybinding scheme
- Familiar conventions from iTerm2/VS Code (`super+d` for vertical split)

**Non-Goals:**

- `move_split` (reordering split positions) — can be added later if needed
- Replacing tmux — this complements tmux for lighter-weight use cases
- Custom resize amounts per direction — uniform 40px increment is sufficient

## Decisions

### Modifier key assignments

| Modifier combo     | Action domain    | Rationale                                          |
| ------------------ | ---------------- | -------------------------------------------------- |
| `super+d/shift+d`  | Create splits    | Follows iTerm2/VS Code convention                  |
| `super+alt+arrow`  | Navigate splits  | `alt` = spatial movement, no conflict with tab nav |
| `super+ctrl+arrow` | Resize splits    | `ctrl` = fine control, mirrors resize semantics    |
| `super+shift+key`  | Split management | Extends existing `super+shift` for management ops  |

**Alternative considered**: Using `super+shift+arrow` for split navigation instead of tab navigation. Rejected because tab navigation is already established and more frequently used.

### Resize increment: 40px

Chose 40px as a balance between responsiveness (noticeable change per keypress) and precision (not too jarring). Users can press repeatedly for larger adjustments, or use `equalize_splits` to reset.

### Config organization

Split keybindings go in a dedicated `# Splits` comment block after the existing tab keybindings, maintaining the established pattern of grouping by function.

## Risks / Trade-offs

- **`super+d` overrides macOS default** (bookmark in some apps) → Acceptable in terminal context; Ghostty is focused when keybind fires
- **40px resize may feel different at various font sizes** → `equalize_splits` provides a reliable reset; amount can be tuned later
- **`super+ctrl+arrow` may conflict with macOS Mission Control** → Users typically disable Mission Control arrow shortcuts or Ghostty captures them first; document if issues arise
