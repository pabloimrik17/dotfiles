## Why

The global `[pre-start].save-base` hook uses `{{ base_worktree_path }}`, which worktrunk only defines on `wt switch --create`. On `wt switch <existing-branch>` the variable expands to undefined and the hook errors out, forcing `--no-hooks`. A plain swap to `{{ primary_worktree_path }}` would lose stack semantics — a branch B created from A via `--base A` should sync approvals back to A on remove (LIFO), not straight to main.

## What Changes

- `[pre-start].save-base` uses `{{ base_worktree_path | default(primary_worktree_path) }}` — keeps stack semantics when base is defined, falls back to primary on `wt switch <existing>`.
- Spec text updated to require the filter explicitly and to forbid both the bare-`base_worktree_path` form (breaks on existing-branch switch) and the bare-`primary_worktree_path` form (loses stack propagation).
- New scenario in `worktrunk-config` covering `wt switch <existing>` regression.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `worktrunk-config`: `save-base` requirement requires the `default()` filter; adds existing-branch switch scenario.
- `claude-settings-writeback`: rename "Base worktree path" requirement to "Sync target path"; update to reference the filter.
- `worktree-file-sync`: update example hook to use the filter; align hook phase to `pre-start` (the spec previously said `post-create`, inconsistent with `worktrunk-config` and `claude-settings-writeback` and with the actual config).

## Impact

- `dot_config/worktrunk/config.toml` — one-line hook change + 3-line comment.
- No on-disk migration: in the dominant `--create` case the filter resolves to the same value previously written.
