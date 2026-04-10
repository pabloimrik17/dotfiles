## Context

gh-dash custom keybindings (`g`, `C`, `W`, `R`) override built-in defaults for navigation, PR checkout, mark-ready-for-review, and refresh-all. This happened incrementally across `add-gh-dash` and `fix-ghd-repo-paths` changes — keys were chosen for mnemonics without cross-referencing the full default keymap.

The current config at `dot_config/gh-dash/config.yml` defines 7 custom keybindings (1 universal, 6 PR). CI checks (`t`/`T`) have no collisions. The remaining 5 need reassignment.

## Goals / Non-Goals

**Goals:**

- Reassign all custom keybindings that collide with built-in defaults to free keys
- Restore `g`, `C`, `W`, `R` to their built-in functions
- Adopt consistent lowercase/UPPERCASE pattern: lowercase = direct execution, UPPERCASE = tmux variant
- Keep the dual execution approach (direct + tmux) unchanged

**Non-Goals:**

- Adding new keybindings for issue view or notifications
- Changing the commands themselves (only the key assignments change)
- Conditional tmux detection or automatic mode switching

## Decisions

### Use `b`/`B` for Claude code review, `i`/`I` for worktree + Claude

Available free key pairs (both cases unused in PR view): `b`/`B`, `f`/`F`, `i`/`I`, `n`/`N`, `z`/`Z`.

Chosen: `b`/`B` for code review ("re**b**iew"), `i`/`I` for worktree + Claude ("**i**mplement"). Alternatives considered:

- `f`/`F` — no mnemonic connection to either action
- `n`/`N` — could mean "new" but doesn't map well to review
- `z`/`Z` — too obscure, hard to remember

The `b`/`i` pairing groups Claude operations on adjacent keys while keeping CI checks at `t`/`T`.

### Use `L` for Lazygit (universal)

`L` is free in all views and is mnemonic for **L**azygit. The collision with `g` (go to first item) is minor since `Home` is an alternative, but reassigning to `L` eliminates the collision entirely.

Alternatives considered:

- Keep `g` and accept the collision — violates the goal of zero collisions
- `G` — would collide with "go to last item"

### Consistent lowercase/UPPERCASE pattern

All custom PR keybindings follow: lowercase = direct execution (suspends TUI), UPPERCASE = tmux split pane. This aligns with the existing `t`/`T` pattern for CI checks and makes the system predictable.

Before: `C`/`R` (review), `W`/`E` (worktree) — no discernible pattern.
After: `b`/`B` (review), `i`/`I` (worktree), `t`/`T` (CI) — consistent.

## Risks / Trade-offs

- [Muscle memory] → Users accustomed to `C`/`W`/`R`/`E` need to relearn. Acceptable since the config is personal and the previous keys were chosen recently.
- [Weak mnemonics for `b`] → "re**b**iew" is a stretch. Mitigated by `name` field in keybindings showing the action in the help menu (`?`).
- [`L` requires shift key] → Lazygit now needs Shift+L instead of just `g`. Acceptable trade-off to restore navigation.
