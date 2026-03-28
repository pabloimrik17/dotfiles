## 1. Worktrunk config migration

- [ ] 1.1 Update `dot_config/worktrunk/config.toml`: rename `[post-create]` to `[post-start]` (deps section only)
- [ ] 1.2 Update `.config/wt.toml`: rename `[post-create]` to `[pre-start]` (copy-ignored + save-base)
- [ ] 1.3 Verify `wt config show` reflects the new hook names after `chezmoi apply`

## 2. Atuin config

- [ ] 2.1 Create `dot_config/atuin/config.toml` with `[daemon] enabled = true` and `[ai] enabled = true`
- [ ] 2.2 Add `dot_config/atuin/config.toml` to chezmoi source state (ensure chezmoi tracks it)
- [ ] 2.3 Verify `chezmoi apply` deploys to `~/.config/atuin/config.toml` and atuin daemon starts

## 3. Manual updates

- [ ] 3.1 Update atuin section (Navigation & Search): add `atuin ai "query"` row and daemon note
- [ ] 3.2 Update delta entry (Git > Other git tools): add external subcommand support (`delta rg`, `delta diff`)
- [ ] 3.3 Update lazygit entry (Git > Other git tools): add file view filtering and worktree branch visibility
- [ ] 3.4 Update worktrunk hooks table (Worktrees > Hooks): rename `post-create` to `pre-start`
- [ ] 3.5 Update worktrunk commands table (Worktrees > Commands): add `wt step <alias>` and `wt merge --no-ff`

## 4. Brew upgrade

- [ ] 4.1 Run `brew upgrade` for all outdated packages
- [ ] 4.2 Verify `wt list` works correctly on worktrunk 0.32
- [ ] 4.3 Verify `atuin` daemon is running and AI responds (`atuin ai "list files"`)
- [ ] 4.4 Verify `lazygit` opens without errors
- [ ] 4.5 Verify `delta` renders diffs correctly (open a git diff)
