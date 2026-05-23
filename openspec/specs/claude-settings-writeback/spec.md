## Purpose

Deep-merge Claude Code local settings back from a worktree to its base worktree on removal, preserving tool approvals accumulated in both branches.

## Requirements

### Requirement: Settings are deep-merged back to base on removal

The system SHALL define a `pre-remove` hook that deep-merges `.claude/settings.local.json` from the current worktree into the base worktree's copy using jq. The merge uses `.[0] * .[1]` for object-level deep merge (worktree wins on conflict), then unions `permissions.allow` and `permissions.deny` arrays from both sides via `unique` to preserve approvals from both branches. Null arrays are handled with `// []` fallback. Empty `permissions.deny` arrays are removed from the output.

#### Scenario: New approvals merge into base settings

- **WHEN** worktree `feature/A` is removed or merged
- **AND** `feature/A` has `.claude/settings.local.json` with approved commands A, B, C, D
- **AND** the base worktree (`develop`) has `.claude/settings.local.json` with approved commands A, B, E
- **THEN** `develop`'s settings SHALL contain approved commands A, B, C, D, E after the merge

#### Scenario: Base worktree has no settings file

- **WHEN** worktree `feature/A` is removed
- **AND** the base worktree has no `.claude/settings.local.json`
- **THEN** the hook SHALL copy the worktree's settings file to the base worktree using `cp` (no merge required)

#### Scenario: Base worktree no longer exists

- **WHEN** worktree `feature/A` is removed
- **AND** the base worktree directory no longer exists
- **THEN** the hook SHALL exit silently without error

#### Scenario: Current worktree has no settings file

- **WHEN** worktree `feature/A` is removed
- **AND** the current worktree has no `.claude/settings.local.json`
- **THEN** the hook SHALL exit silently without error

#### Scenario: No base path file exists or contains invalid content

- **WHEN** worktree `feature/A` is removed
- **AND** `.claude/.worktree-base` does not exist, is empty, contains only whitespace, or contains a syntactically invalid path
- **THEN** the hook SHALL treat it as missing and exit silently without error

#### Scenario: Deep merge fails

- **WHEN** worktree `feature/A` is removed
- **AND** `.claude/settings.local.json` contains invalid JSON or `jq` is not installed
- **THEN** the hook SHALL log a warning and exit without modifying the base worktree's settings

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
