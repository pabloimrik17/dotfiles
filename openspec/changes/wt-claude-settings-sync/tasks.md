## 1. Hook Configuration

- [ ] 1.1 Add `save-base` command to `[post-create]` in `.config/wt.toml` that writes `{{ base_worktree_path }}` to `.claude/.worktree-base`
- [ ] 1.2 Add `[pre-remove]` section with `sync-claude` hook that deep-merges `.claude/settings.local.json` back to base worktree using `jq`

## 2. Verification

- [ ] 2.1 Create a test worktree, verify `.claude/.worktree-base` contains correct base path
- [ ] 2.2 Modify `.claude/settings.local.json` in test worktree, remove it, verify base worktree has merged settings
- [ ] 2.3 Verify edge cases: no settings file, no base file, missing base worktree — all exit silently
