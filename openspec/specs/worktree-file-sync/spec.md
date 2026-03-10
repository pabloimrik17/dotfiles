## ADDED Requirements

### Requirement: Gitignored files are copied on worktree creation

The system SHALL copy whitelisted gitignored files from the source worktree to the new worktree when `wt switch --create` is used, via a `post-create` hook running `wt step copy-ignored`.

#### Scenario: New worktree gets Claude settings

- **WHEN** a new worktree is created with `wt switch --create <branch>`
- **THEN** `.claude/settings.local.json` is copied from the main worktree to the new worktree

#### Scenario: Existing files are not overwritten

- **WHEN** a worktree already has `.claude/settings.local.json`
- **THEN** `wt step copy-ignored` SHALL skip the file (default behavior, no `--force`)

### Requirement: Only whitelisted directories are copied

The system SHALL use a `.worktreeinclude` file to restrict which gitignored files are copied. Only files matching `.worktreeinclude` patterns AND listed in `.gitignore` are copied.

#### Scenario: Non-whitelisted gitignored files are excluded

- **WHEN** `wt step copy-ignored` runs
- **THEN** `.idea/`, `.husky/_/`, and `node_modules/` SHALL NOT be copied

#### Scenario: Whitelisted directory is copied

- **WHEN** `wt step copy-ignored` runs
- **THEN** only files under `.claude/` SHALL be copied

### Requirement: Hook is defined in project config

The `post-create` hook running `wt step copy-ignored` SHALL be defined in `.config/wt.toml` (project config, checked into git).

#### Scenario: Hook is shared across team

- **WHEN** a developer clones the repo and uses `wt switch --create`
- **THEN** the copy hook runs automatically (after security approval)
