## Context

The quick terminal keybind `super+shift+t` was chosen in the original ghostty-config-enhancement change as "collision-free." However, it conflicts with Chrome's Cmd+Shift+T (reopen closed tab) — a frequently used shortcut.

Ghostty 1.2.0 introduced W3C-based key code naming, making physical key references like `backquote` available regardless of keyboard layout.

## Goals / Non-Goals

**Goals:**

- Replace keybind with one that doesn't collide with Chrome or macOS system shortcuts
- Maintain Quake-style ergonomics (fast, one-hand toggle)

**Non-Goals:**

- Changing any other quick terminal settings (position, size, animation, etc.)
- Supporting multiple keybind options or configurability

## Decisions

### Decision: Use `ctrl+º` as the new keybind

**Choice**: `global:ctrl+º=toggle_quick_terminal`

**Rationale**: On Spanish ISO Mac keyboard, `backquote` is the `º` key (top-left, above Tab). This is the classic "Quake console" position.

Alternatives evaluated:

| Option                    | Verdict                                                  |
| ------------------------- | -------------------------------------------------------- |
| `super+shift+t` (current) | ❌ Collides with Chrome "reopen closed tab"              |
| `super+backquote`         | ❌ Collides with macOS "switch windows of same app"      |
| `alt+backquote`           | ⚠️ macOS may intercept Option+key for character input    |
| `super+ctrl+t`            | ✅ Free, but triple modifier is awkward                  |
| `ctrl+º`                  | ✅ Free in macOS, Chrome, WebStorm. Classic Quake-style. |

**Trade-off**: `ctrl+º` is used by VS Code for "toggle integrated terminal," but user is 95% WebStorm. In VS Code, Ghostty's global binding would take precedence anyway.

## Risks / Trade-offs

- **[Muscle memory]** → One-time relearning cost. Low friction since this is a recent addition.
- **[VS Code conflict]** → Ghostty global keybind overrides VS Code's `ctrl+backtick`. Acceptable given minimal VS Code usage.
- **[Ghostty key naming on Spanish ISO]** → W3C key name `backquote` does not map to the `º` key on Spanish ISO Mac (it maps to `IntlBackslash` in W3C). Using the Unicode character `º` directly in the keybind config works correctly — Ghostty matches layout-dependent characters.
