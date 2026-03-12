## Context

`.config/wt.toml` already has a `post-create` hook running `wt step copy-ignored` which copies `.claude/` forward. But settings changes during the worktree session (new command approvals) don't flow back. The base worktree path is available as `{{ base_worktree_path }}` only during creation hooks, not during remove/merge hooks.

## Goals / Non-Goals

**Goals:**

- Persist Claude settings approvals across worktree lifecycle (create → work → remove)
- Deep merge settings so both source and worktree approvals survive
- Zero manual intervention required

**Non-Goals:**

- Syncing other Claude files (projects, conversations)
- Real-time sync between concurrent worktrees
- Conflict resolution UI — jq deep merge with worktree-wins semantics is sufficient

## Decisions

### Save base path at creation time

`{{ base_worktree_path }}` only available in post-create/post-start. Save to `.claude/.worktree-base` so pre-remove can read it. File is gitignored (inside `.claude/`). Alternative: use `{{ primary_worktree_path }}` (always main) — rejected because user wants settings to return to the actual source branch.

### Deep merge with jq instead of copy

`jq -s '.[0] * .[1]'` merges base settings (.[0]) with worktree settings (.[1]). Worktree keys win on conflict (most recent approvals). Alternative: plain `cp` — rejected because it would overwrite approvals granted in the base worktree while the feature branch was active.

### Fallback to copy when base has no settings file

If `$BASE_SETTINGS` doesn't exist, just `cp` the worktree file. Handles case where base worktree was cleaned up or never had settings.

### pre-remove hook (not post-merge)

pre-remove runs before the worktree is deleted, so files are still accessible. Runs during both `wt merge` and `wt remove`. post-merge runs after removal — files already gone.

## Risks / Trade-offs

- **[jq dependency]** → Already installed on user's system (verified). Most macOS/Linux systems have it. Hook fails silently with `|| true` if missing.
- **[Concurrent worktrees from same base]** → Last one to merge/remove wins for conflicting keys. Acceptable since deep merge preserves non-conflicting keys. Known limitation: if two worktrees from the same base modify the same key, the last one removed wins. Mitigation: non-overlapping approval sets are the common case; manual reconciliation is possible but not expected to be needed.
- **[Base worktree removed before feature]** → pre-remove checks `$BASE_WT` directory exists before copying. Falls back to no-op.
