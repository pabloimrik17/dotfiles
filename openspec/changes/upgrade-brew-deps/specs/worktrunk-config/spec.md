## MODIFIED Requirements

### Requirement: Post-start hook with package manager detection

The user config SHALL define a `post-start` hook (renamed from `post-create` per worktrunk 0.32) that detects the project's package manager by lockfile presence and runs the appropriate install command. The hook runs in background and does not block worktree creation — deps failure is recoverable.

#### Scenario: Bun project

- **WHEN** a new worktree is created in a directory containing `bun.lock`
- **THEN** the post-start hook SHALL run `bun install` in background

#### Scenario: pnpm project

- **WHEN** a new worktree is created in a directory containing `pnpm-lock.yaml`
- **THEN** the post-start hook SHALL run `pnpm install` in background

#### Scenario: npm project

- **WHEN** a new worktree is created in a directory containing `package-lock.json`
- **THEN** the post-start hook SHALL run `npm install` in background

#### Scenario: Multiple lockfiles (precedence bun > pnpm > npm)

- **WHEN** a new worktree is created in a directory containing both `bun.lock` and `pnpm-lock.yaml`
- **THEN** the post-start hook SHALL run `bun install` and SHALL NOT run `pnpm install` or `npm install`

#### Scenario: No JS project

- **WHEN** a new worktree is created in a directory with no recognized lockfile
- **THEN** the post-start hook SHALL exit silently without error

#### Scenario: Deps install failure does not block creation

- **WHEN** a new worktree is created and `bun install` fails (e.g., network error)
- **THEN** the worktree SHALL still be created and usable
- **AND** the user can manually run `bun install` to recover
