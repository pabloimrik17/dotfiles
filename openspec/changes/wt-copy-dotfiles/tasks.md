## 1. Configuration Files

- [ ] 1.1 Create `.worktreeinclude` with `.claude/` pattern
- [ ] 1.2 Create `.config/wt.toml` with `post-create` hook running `wt step copy-ignored`

## 2. Verification

- [ ] 2.1 Run `wt step copy-ignored --dry-run` to confirm only `.claude/` files are selected
- [ ] 2.2 Test worktree creation with `wt switch --create` and verify `.claude/settings.local.json` is copied
