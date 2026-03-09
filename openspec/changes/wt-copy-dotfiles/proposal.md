## Why

Git worktrees don't share untracked/gitignored files. When switching branches in the same directory, files like `.claude/settings.local.json` come along — but new worktrees start cold. This breaks Claude Code permissions and requires manual file copying.

## What Changes

- Add `.worktreeinclude` to whitelist gitignored files for cross-worktree copy (`.claude/` only)
- Add `.config/wt.toml` with `post-create` hook running `wt step copy-ignored`
- Update `.gitignore` to exclude `.worktrees/` (already present, no change needed)

## Capabilities

### New Capabilities

- `worktree-file-sync`: Configuration for copying gitignored files between worktrees via worktrunk hooks

### Modified Capabilities

_(none)_

## Impact

- New files: `.config/wt.toml`, `.worktreeinclude`
- Affects all worktree creation via `wt switch --create`
- User config `post-create.deps` (install deps) runs before project hook `post-create.copy` — no conflict since `.claude/` and `node_modules/` don't overlap
