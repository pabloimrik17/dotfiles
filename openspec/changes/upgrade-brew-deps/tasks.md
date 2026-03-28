## 1. Worktrunk config migration

- [x] 1.1 Update `dot_config/worktrunk/config.toml`: rename `[post-create]` to `[post-start]` (deps section only)
- [x] 1.2 Update `.config/wt.toml`: rename `[post-create]` to `[pre-start]` (copy-ignored + save-base)
- [x] 1.3 Verify `wt config show` reflects the new hook names after `chezmoi apply`

## 2. Atuin config

- [x] 2.1 Create `dot_config/atuin/config.toml` with `[daemon] enabled = true` and `[ai] enabled = true`
- [x] 2.2 Add `dot_config/atuin/config.toml` to chezmoi source state (ensure chezmoi tracks it)
- [x] 2.3 Verify `chezmoi apply` deploys to `~/.config/atuin/config.toml` and atuin daemon starts

## 3. Manual updates

- [x] 3.1 Update atuin section (Navigation & Search): add `atuin ai "query"` row and daemon note
- [x] 3.2 Update delta entry (Git > Other git tools): add external subcommand support (`delta rg`, `delta diff`)
- [x] 3.3 Update lazygit entry (Git > Other git tools): add file view filtering and worktree branch visibility
- [x] 3.4 Update worktrunk hooks table (Worktrees > Hooks): rename `post-create` to `pre-start`
- [x] 3.5 Update worktrunk commands table (Worktrees > Commands): add `wt step <alias>` and `wt merge --no-ff`

## 4. Brew upgrade

- [x] 4.1 Run `brew upgrade` for all outdated packages
- [x] 4.2 Verify `wt list` works correctly on worktrunk 0.33
- [x] 4.3 Verify `atuin` daemon is running and AI responds (`?` prefix)
- [x] 4.4 Verify `lazygit` opens without errors
- [x] 4.5 Verify `delta` renders diffs correctly (open a git diff)
