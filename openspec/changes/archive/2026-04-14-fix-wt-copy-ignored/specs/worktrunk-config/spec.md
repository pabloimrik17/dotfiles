## ADDED Requirements

### Requirement: Pre-start hook copies gitignored files

The user config SHALL define a `[pre-start]` hook that runs `wt step copy-ignored` to copy whitelisted gitignored files from the primary worktree to the new worktree before any post-start hooks execute.

#### Scenario: Gitignored files copied before dependency installation

- **WHEN** a new worktree is created via worktrunk
- **THEN** `wt step copy-ignored` SHALL run before `[post-start].deps`, ensuring lockfiles and config files are available for dependency installation

#### Scenario: Pre-start hook defined in global config

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.config/worktrunk/config.toml` SHALL contain a `[pre-start]` section with `copy = "wt step copy-ignored"`

#### Scenario: No .worktreeinclude in project

- **WHEN** a new worktree is created in a project without a `.worktreeinclude` file
- **THEN** `wt step copy-ignored` SHALL exit cleanly without error
