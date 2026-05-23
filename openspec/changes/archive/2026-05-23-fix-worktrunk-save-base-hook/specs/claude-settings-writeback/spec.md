## RENAMED Requirements

- FROM: `### Requirement: Base worktree path is saved at creation time`
- TO: `### Requirement: Sync target path is saved at worktree creation`

## MODIFIED Requirements

### Requirement: Sync target path is saved at worktree creation

The system SHALL save the sync target path to `.claude/.worktree-base` in the `[pre-start].save-base` hook defined by the `worktrunk-config` capability, rendered as `{{ base_worktree_path | default(primary_worktree_path) }}`. The filter preserves stack semantics on `wt switch --create … --base <branch>` (path of the base branch's worktree) while falling back to the primary worktree path when `base_worktree_path` is undefined (e.g. `wt switch <existing-branch>` without `--create`).

#### Scenario: Stacked branch syncs back to its base on remove

- **GIVEN** worktree `feature-B` created via `wt switch --create feature-B --base feature-A`
- **WHEN** `feature-B` is removed
- **THEN** `sync-claude` SHALL merge `feature-B`'s `settings.local.json` into `feature-A`'s copy (using the path stored in `.claude/.worktree-base`)

#### Scenario: Existing-branch switch syncs back to primary

- **GIVEN** worktree materialized via `wt switch <existing-branch>` (no `--create`)
- **WHEN** that worktree is removed
- **THEN** `sync-claude` SHALL merge its `settings.local.json` into the primary worktree's copy
