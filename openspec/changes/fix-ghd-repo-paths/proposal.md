## Why

The `C` keybinding in gh-dash fails with `failed to parsetemplate` because `repoPaths` uses an unsupported `"*/*"` wildcard pattern. Additionally, keybindings rely on `tmux new-window` which fails silently outside a tmux session, and keybindings lack `name` fields making the help menu show raw commands.

## What Changes

- Fix `repoPaths` pattern from `"*/*": ~/WebstormProjects/*` to `:owner/:repo` template syntax that gh-dash actually supports
- Fix existing tmux keybinding (was broken due to empty `{{.RepoPath}}`)
- Add direct execution (non-tmux) variants of each keybinding as alternatives
- Maintain both tmux and direct variants so user can compare workflows
- Add `name` field to all keybindings for readable help menu entries
- Key scheme: `C`/`W` = direct, `R`/`E` = tmux variants
- Pass `-C {{.RepoPath}}` to `wt switch` since gh-dash doesn't cd into the repo directory

## Capabilities

### New Capabilities

- `gh-dash-repo-paths`: repoPaths configuration using supported `:owner/:repo` template pattern
- `gh-dash-keybindings`: keybinding definitions with names, direct execution mode, and worktree integration

### Modified Capabilities

## Impact

- `dot_config/gh-dash/config.yml`: repoPaths and keybindings sections rewritten
- Direct variants work in any terminal context; tmux variants require active tmux session
- Requires `wt` (worktrunk) CLI to be available for PR checkout keybindings
