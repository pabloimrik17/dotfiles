## Why

Custom keybindings in gh-dash override useful built-in defaults without realizing it:

- `g` (universal, Lazygit) overrides "go to first item" navigation
- `C` (PR, Code review Claude) overrides "Checkout PR" (`gh pr checkout`)
- `W` (PR, Worktree + Claude) overrides "Mark ready for review" (`gh pr ready`)
- `R` (PR, Code review tmux) overrides "Refresh all sections"

Checkout and mark-ready are common PR workflows that become inaccessible. The fix is reassigning custom keybindings to free keys while restoring all built-in defaults.

## What Changes

Remap all custom keybindings that collide with built-in defaults to unused keys. Adopt a consistent pattern: lowercase = direct execution, uppercase = tmux variant.

| Before          | After           | Action                         |
| --------------- | --------------- | ------------------------------ |
| `g` (universal) | `L` (universal) | Lazygit                        |
| `C` (PR)        | `b` (PR)        | Code review Claude (direct)    |
| `R` (PR)        | `B` (PR)        | Code review Claude (tmux)      |
| `W` (PR)        | `i` (PR)        | Worktree + Claude (direct)     |
| `E` (PR)        | `I` (PR)        | Worktree + Claude (tmux)       |
| `t` (PR)        | `t` (PR)        | CI checks (direct) — no change |
| `T` (PR)        | `T` (PR)        | CI checks (tmux) — no change   |

Restored built-in defaults:

- `g`/`G` — first/last item navigation
- `C` — checkout PR
- `W` — mark ready for review
- `R` — refresh all sections

## Capabilities

### Modified Capabilities

- `gh-dash-keybindings`: reassign keys to avoid collisions with built-in defaults

## Impact

- `dot_config/gh-dash/config.yml`: keybindings section updated (key values and names only, commands unchanged)
- No new dependencies or tools
- Help menu (`?`) will reflect the new key assignments
