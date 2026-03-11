## Why

Claude Code settings (`.claude/settings.local.json`) accumulate approved commands during worktree sessions. Currently `post-create` copies settings forward via `wt step copy-ignored`, but new approvals granted during the session are lost when the worktree is merged or removed. Settings should flow back to the source branch's worktree.

## What Changes

- Add `post-create` hook to save the base worktree path to `.claude/.worktree-base`
- Add `pre-remove` hook to deep-merge `.claude/settings.local.json` back to the base worktree using `jq`
- Deep merge ensures approvals from both branches are preserved (not overwritten)

## Capabilities

### New Capabilities

- `claude-settings-writeback`: Sync Claude Code settings back to the source worktree on merge/remove, preserving approvals from both branches via jq deep merge

### Modified Capabilities

- `worktree-file-sync`: Add base tracking and writeback hooks alongside existing copy-forward behavior

## Impact

- `.config/wt.toml`: new hooks added (save-base in post-create, sync-claude in pre-remove)
- Runtime dependency on `jq` for deep merge (falls back to copy if base has no settings)
- `.claude/.worktree-base` created as transient file in worktrees (gitignored)
