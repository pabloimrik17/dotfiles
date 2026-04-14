# Capability: worktrunk-config

## Purpose

Manage worktrunk user configuration via chezmoi, including post-create hooks for automatic package manager detection and dependency installation in new worktrees.

## Requirements

### Requirement: Chezmoi-managed user config

A worktrunk user configuration file SHALL be managed by chezmoi at `dot_config/worktrunk/config.toml`, targeting `~/.config/worktrunk/config.toml`.

#### Scenario: Config applied on fresh machine

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.config/worktrunk/config.toml` SHALL exist with the default configuration

### Requirement: Post-create hook with package manager detection

The user config SHALL define a `post-create` hook that detects the project's package manager by lockfile presence and runs the appropriate install command.

#### Scenario: Bun project

- **WHEN** a new worktree is created in a directory containing `bun.lock`
- **THEN** the post-create hook SHALL run `bun install`

#### Scenario: pnpm project

- **WHEN** a new worktree is created in a directory containing `pnpm-lock.yaml`
- **THEN** the post-create hook SHALL run `pnpm install`

#### Scenario: npm project

- **WHEN** a new worktree is created in a directory containing `package-lock.json`
- **THEN** the post-create hook SHALL run `npm install`

#### Scenario: Multiple lockfiles (precedence bun > pnpm > npm)

- **WHEN** a new worktree is created in a directory containing both `bun.lock` and `pnpm-lock.yaml`
- **THEN** the post-create hook SHALL run `bun install` and SHALL NOT run `pnpm install` or `npm install`

#### Scenario: No JS project

- **WHEN** a new worktree is created in a directory with no recognized lockfile
- **THEN** the post-create hook SHALL exit silently without error

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
