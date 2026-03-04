## ADDED Requirements

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

#### Scenario: No JS project
- **WHEN** a new worktree is created in a directory with no recognized lockfile
- **THEN** the post-create hook SHALL exit silently without error
