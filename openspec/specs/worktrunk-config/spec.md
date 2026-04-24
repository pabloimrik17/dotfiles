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

### Requirement: Copy-ignored exclude list for regenerable directories

The user config SHALL define a `[step.copy-ignored]` section with an `exclude` list that prevents `wt step copy-ignored` from copying regenerable or path-sensitive directories into new worktrees. The list SHALL cover Node package directories, framework build outputs and caches, bundler and transpiler caches, generic build outputs, test and coverage artifacts, and Python tool caches and virtual environments. Entries SHALL use worktrunk's documented directory syntax (trailing `/`).

#### Scenario: Exclude block present after chezmoi apply

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.config/worktrunk/config.toml` SHALL contain a `[step.copy-ignored]` section with a non-empty `exclude` array

#### Scenario: Exclude list covers Node package directories

- **WHEN** `wt config show` is executed
- **THEN** the reported `[step.copy-ignored].exclude` list SHALL include `node_modules/`

#### Scenario: Exclude list covers framework build caches

- **WHEN** `wt config show` is executed
- **THEN** the reported `[step.copy-ignored].exclude` list SHALL include `.next/`, `.nx/`, `.turbo/`, and `.expo/`

#### Scenario: Exclude list covers bundler and transpiler caches

- **WHEN** `wt config show` is executed
- **THEN** the reported `[step.copy-ignored].exclude` list SHALL include `.cache/`, `.parcel-cache/`, `.vite/`, and `.swc/`

#### Scenario: Exclude list covers generic build outputs

- **WHEN** `wt config show` is executed
- **THEN** the reported `[step.copy-ignored].exclude` list SHALL include `dist/`, `build/`, `out/`, and `storybook-static/`

#### Scenario: Exclude list covers test and coverage artifacts

- **WHEN** `wt config show` is executed
- **THEN** the reported `[step.copy-ignored].exclude` list SHALL include `coverage/`, `.nyc_output/`, `htmlcov/`, `playwright-report/`, and `test-results/`

#### Scenario: Exclude list covers Python tool caches and venvs

- **WHEN** `wt config show` is executed
- **THEN** the reported `[step.copy-ignored].exclude` list SHALL include `__pycache__/`, `.pytest_cache/`, `.mypy_cache/`, `.ruff_cache/`, `.venv/`, and `venv/`

#### Scenario: JetBrains project state is not excluded

- **WHEN** `wt config show` is executed
- **THEN** the reported `[step.copy-ignored].exclude` list SHALL NOT include `.idea/`

#### Scenario: CocoaPods directory is not excluded

- **WHEN** `wt config show` is executed
- **THEN** the reported `[step.copy-ignored].exclude` list SHALL NOT include `ios/Pods/`

#### Scenario: node_modules not copied into new worktree

- **GIVEN** a Node project with `node_modules/` populated in the primary worktree
- **WHEN** the user runs `wt switch --create <branch>`
- **THEN** the new worktree SHALL NOT contain a `node_modules/` directory copied from the primary worktree before `[post-start].deps` runs
- **AND** the `[post-start].deps` hook SHALL still install dependencies successfully

#### Scenario: Framework build caches not copied into new worktree

- **GIVEN** a Node project with `.next/` and `.nx/` populated in the primary worktree
- **WHEN** the user runs `wt switch --create <branch>`
- **THEN** the new worktree SHALL NOT contain `.next/` or `.nx/` copied from the primary worktree
