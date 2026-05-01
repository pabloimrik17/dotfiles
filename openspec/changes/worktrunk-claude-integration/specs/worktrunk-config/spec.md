## ADDED Requirements

### Requirement: Global pre-start save-base hook for Claude worktrees

The user config SHALL define a `[pre-start].save-base` hook that records the base worktree path to `.claude/.worktree-base` in the new worktree, but ONLY when a `.claude/` directory already exists in the new worktree. The hook SHALL be a no-op (exit 0) for any repository that does not use Claude Code.

#### Scenario: Claude-enabled project records base path

- **GIVEN** a repository that contains a `.claude/` directory
- **WHEN** the user runs `wt switch --create <branch>`
- **THEN** the file `.claude/.worktree-base` SHALL exist in the new worktree, containing the absolute path of the base worktree (the value of `{{ base_worktree_path }}` rendered by worktrunk)

#### Scenario: Non-Claude project unaffected

- **GIVEN** a repository that does not contain a `.claude/` directory
- **WHEN** the user runs `wt switch --create <branch>`
- **THEN** the `[pre-start].save-base` hook SHALL exit cleanly without creating any file and without printing an error
- **AND** no other pre-start hook SHALL be affected

#### Scenario: Hook present in global config after chezmoi apply

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.config/worktrunk/config.toml` SHALL contain a `[pre-start]` section that includes a `save-base` key whose value writes `.claude/.worktree-base` and is guarded by an `[ -d .claude ]` test

### Requirement: Global pre-remove sync-claude hook merges Claude permissions back to base worktree

The user config SHALL define a `[pre-remove].sync-claude` hook that, when the worktree being removed contains a `.claude/settings.local.json` and a `.claude/.worktree-base` file pointing to a still-existing base worktree, deep-merges the worktree's `settings.local.json` back into the base worktree's copy. The merge SHALL union the `permissions.allow` and `permissions.deny` arrays (worktree values taking precedence on conflicts) and SHALL be written atomically (`.tmp` + `mv`). The hook SHALL never block worktree removal: any failure is logged to stderr and exits 0.

#### Scenario: Approvals merged on remove

- **GIVEN** a worktree where Claude has appended new entries to `permissions.allow` in `.claude/settings.local.json`
- **AND** the base worktree has its own `.claude/settings.local.json`
- **WHEN** the user runs `wt remove <branch>`
- **THEN** the base worktree's `.claude/settings.local.json` SHALL contain the union of both files' `permissions.allow` arrays, deduplicated, with no entries lost from either side

#### Scenario: First-time copy when base has no settings

- **GIVEN** a worktree with `.claude/settings.local.json` populated
- **AND** the base worktree has no `.claude/settings.local.json`
- **WHEN** the user runs `wt remove <branch>`
- **THEN** the worktree's `.claude/settings.local.json` SHALL be copied to the base worktree's `.claude/settings.local.json`, creating `.claude/` in the base if it does not exist

#### Scenario: Missing base path is silently skipped

- **GIVEN** a worktree without `.claude/.worktree-base`
- **WHEN** the user runs `wt remove <branch>`
- **THEN** the `sync-claude` hook SHALL exit 0 without writing anything to the base worktree
- **AND** worktree removal SHALL proceed normally

#### Scenario: Missing settings file is silently skipped

- **GIVEN** a worktree with `.claude/.worktree-base` present but no `.claude/settings.local.json`
- **WHEN** the user runs `wt remove <branch>`
- **THEN** the `sync-claude` hook SHALL exit 0 without writing anything to the base worktree

#### Scenario: Disappeared base worktree is silently skipped

- **GIVEN** a worktree whose `.claude/.worktree-base` references a directory that no longer exists
- **WHEN** the user runs `wt remove <branch>`
- **THEN** the `sync-claude` hook SHALL exit 0 without error
- **AND** worktree removal SHALL proceed normally

#### Scenario: Merge failure does not block remove

- **WHEN** the merge command fails for any reason (e.g., jq missing, malformed JSON, disk full)
- **THEN** the `sync-claude` hook SHALL print a warning to stderr and exit 0 so worktree removal proceeds

#### Scenario: Hook present in global config after chezmoi apply

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.config/worktrunk/config.toml` SHALL contain a `[pre-remove]` section that includes a `sync-claude` key whose body performs the guarded jq deep-merge described above
