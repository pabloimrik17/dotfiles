## Why

Custom gh-dash shortcuts `t` and `L` shadow smart filtering and label editing in the installed gh-dash v4.26.2. Beads task `WebstormProjects-bts` restores those built-ins while preserving the custom commands; this proposal records the implementation already completed in this worktree.

## What Changes

- **BREAKING**: Move universal lazygit from `L` to `J` and PR CI checks from `t`/`T` to `i`/`I` (direct/tmux).
- Preserve all seven custom commands and their names, including tuicr and AoE bindings.
- Remove the documented collision exceptions and update the keybinding manual and specs with version-specific evidence.
- Record completed static validation separately from interactive checks that have not been performed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `gh-dash-keybindings`: Reserve built-in keys, move lazygit to `J`, and use `i`/`I` for the direct/tmux CI pair.
- `gh-enhance-integration`: Move inline and tmux ENHANCE shortcuts to `i` and `I` while retaining command behavior and theme.

## Impact

Changes affect `dot_config/gh-dash/config.yml`, `docs/manual.html`, and the two existing capability specs. There are no dependency changes, host-wide dotfiles applications, or command payload changes. Users must adopt the new shortcuts when they load this configuration. Work is tracked as `WebstormProjects-bts`; the prior Beads publication attempt timed out and is not treated as successful.
