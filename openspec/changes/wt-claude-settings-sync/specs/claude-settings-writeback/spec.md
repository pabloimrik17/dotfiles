## ADDED Requirements

### Requirement: Base worktree path is saved at creation time

The system SHALL save `{{ base_worktree_path }}` to `.claude/.worktree-base` in the `post-create` hook defined in `worktree-file-sync/spec.md` (alongside `wt step copy-ignored`), so that `pre-remove` can identify the source worktree.

#### Scenario: Base path persisted on worktree creation

- **WHEN** a new worktree is created with `wt switch --create feature/A` from the `develop` worktree
- **THEN** `.claude/.worktree-base` in the new worktree SHALL contain the absolute path to the `develop` worktree

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
