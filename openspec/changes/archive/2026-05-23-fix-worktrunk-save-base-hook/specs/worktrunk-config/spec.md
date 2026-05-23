## MODIFIED Requirements

### Requirement: Global pre-start save-base hook for Claude worktrees

The user config SHALL define a `[pre-start].save-base` hook that records the sync target worktree path to `.claude/.worktree-base` in the new worktree, but ONLY when a `.claude/` directory already exists in the new worktree. The hook SHALL be a no-op (exit 0) for any repository that does not use Claude Code. The hook SHALL render `{{ base_worktree_path | default(primary_worktree_path) }}` so that operation-scoped `base_worktree_path` (defined on `--create`) is preferred when available — preserving stack propagation — and `primary_worktree_path` is used as fallback when `base_worktree_path` is undefined (e.g. `wt switch <existing-branch>`).

#### Scenario: Stacked branch records base worktree path

- **GIVEN** a Claude-enabled repository with worktree `feature-A`
- **WHEN** the user runs `wt switch --create feature-B --base feature-A`
- **THEN** `.claude/.worktree-base` in the `feature-B` worktree SHALL contain the absolute path of the `feature-A` worktree

#### Scenario: --create from default branch records primary path

- **GIVEN** a Claude-enabled repository
- **WHEN** the user runs `wt switch --create <branch>` without `--base`
- **THEN** `.claude/.worktree-base` SHALL contain the absolute path of the primary worktree (which equals `base_worktree_path` in this case)

#### Scenario: Switch to existing branch falls back to primary

- **GIVEN** a Claude-enabled repository and an existing local branch without a worktree
- **WHEN** the user runs `wt switch <branch>` (no `--create`)
- **THEN** the `save-base` hook SHALL succeed and `.claude/.worktree-base` SHALL contain the absolute path of the primary worktree
- **AND** the hook SHALL NOT fail with an undefined-value template error

#### Scenario: Non-Claude project unaffected

- **GIVEN** a repository without a `.claude/` directory
- **WHEN** the user runs `wt switch --create <branch>`
- **THEN** the hook SHALL exit cleanly without creating any file or printing an error

#### Scenario: Hook present in global config after chezmoi apply

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.config/worktrunk/config.toml` SHALL contain a `[pre-start]` section with a `save-base` key that renders `{{ base_worktree_path | default(primary_worktree_path) }}` into `.claude/.worktree-base`, guarded by `[ -d .claude ]`
