# Spec Delta

## MODIFIED Requirements

### Requirement: Install-deps post-start hook with package manager detection

The user config SHALL define a `[post-start].install-deps` hook (`user:post-start:install-deps`) that detects the project's package manager by lockfile presence and runs the appropriate install command. A failed installation SHALL make the hook exit with the install command's nonzero status. Skipped installations SHALL exit zero without claiming installation success.

#### Scenario: Bun project

- **WHEN** a new worktree is created in a directory containing `bun.lock`
- **THEN** the `[post-start].install-deps` hook SHALL run `bun install`

#### Scenario: pnpm project

- **WHEN** a new worktree is created in a directory containing `pnpm-lock.yaml`
- **THEN** the `[post-start].install-deps` hook SHALL run `pnpm install`

#### Scenario: npm project

- **WHEN** a new worktree is created in a directory containing `package-lock.json`
- **THEN** the `[post-start].install-deps` hook SHALL run `npm install`

#### Scenario: Multiple lockfiles (precedence bun > pnpm > npm)

- **WHEN** a new worktree is created in a directory containing both `bun.lock` and `pnpm-lock.yaml`
- **THEN** the `[post-start].install-deps` hook SHALL run `bun install` and SHALL NOT run `pnpm install` or `npm install`

#### Scenario: pnpm takes precedence over npm

- **WHEN** the worktree contains `pnpm-lock.yaml` and `package-lock.json` but no `bun.lock`
- **THEN** the hook SHALL run only `pnpm install`

#### Scenario: No JS project

- **WHEN** a new worktree is created in a directory with no recognized lockfile
- **THEN** the `[post-start].install-deps` hook SHALL exit without error and emit detection and skip markers without attempting installation

#### Scenario: Selected package manager is unavailable

- **WHEN** the selected package manager is unavailable in the hook's effective PATH
- **THEN** the hook SHALL warn that installation was skipped and exit zero
- **AND** it SHALL NOT fall back to another package manager or emit `[install-deps] done`

#### Scenario: Install command fails

- **WHEN** any selected Bun, pnpm, or npm install command exits with a nonzero status
- **THEN** the hook SHALL return that status and log the package manager and exit status to stderr
- **AND** it SHALL NOT emit `[install-deps] done` or attempt another package manager

### Requirement: Install-deps hook emits phased log markers

The post-start install-deps hook SHALL emit `[install-deps]` markers for detection, installation start when applicable, and outcome. `[install-deps] done` SHALL mean an install command succeeded; skips and failures SHALL have distinct messages. Output retrieved through `wt config state logs --format=json | jq`, filtered on `user:post-start:install-deps`, SHALL identify the active phase and outcome.

#### Scenario: Detection phase logged

- **WHEN** a new worktree is created
- **THEN** the install-deps hook log SHALL contain a line beginning with `[install-deps]` indicating the detection phase started

#### Scenario: Selected package manager logged

- **WHEN** the install-deps hook detects a lockfile (`bun.lock`, `pnpm-lock.yaml`, or `package-lock.json`) and its package manager is available
- **THEN** the log SHALL contain a `[install-deps]` line naming the detected package manager before `<pm> install` runs

#### Scenario: Completion logged

- **WHEN** the install command exits zero
- **THEN** the log SHALL contain `[install-deps] done` after the install output and the hook SHALL exit zero

#### Scenario: No-op project still emits markers

- **WHEN** a new worktree is created in a directory with no recognized lockfile
- **THEN** the log SHALL contain `[install-deps]` detection and skip markers, exiting with code zero
- **AND** the log SHALL NOT contain `[install-deps] done`

#### Scenario: Failure is distinguishable from completion

- **WHEN** an install command fails
- **THEN** the log SHALL contain a `[install-deps]` failure marker naming the package manager and its exit status
- **AND** the log SHALL NOT contain a success completion marker

## ADDED Requirements

### Requirement: Install-deps selects an installed project Node

For a recognized lockfile, the hook SHALL use an installed nvm Node matching the worktree root's numeric `.nvmrc` pin before resolving or running the package manager. It SHALL honor `NVM_DIR`, defaulting to `$HOME/.nvm`, and scope PATH changes to the hook and its children. It SHALL NOT source nvm or install Node versions. Missing or empty `.nvmrc` SHALL preserve ambient PATH; unresolved nonempty pins SHALL warn and preserve ambient PATH.

#### Scenario: Exact pin overrides ambient Node

- **GIVEN** ambient Node 24 and an installed nvm Node 22.21.0
- **WHEN** a pnpm worktree with strict `engines.node` set to 22.21.0 and `.nvmrc` containing `22.21.0` runs the hook
- **THEN** pnpm and its Node-based child processes SHALL resolve Node 22.21.0
- **AND** with otherwise valid dependencies and installation prerequisites, installation SHALL populate `node_modules` and exit zero

#### Scenario: Version formatting is normalized

- **WHEN** `.nvmrc` contains an exact numeric pin with an optional leading `v`, surrounding whitespace, CRLF, or no final newline
- **THEN** the hook SHALL select the same installed version as the plain numeric pin

#### Scenario: Major and minor pins choose the newest matching installation

- **WHEN** `.nvmrc` contains `22` or `22.21` and multiple matching installed versions exist
- **THEN** the hook SHALL select the highest matching numeric version with a usable `bin/node`
- **AND** it SHALL NOT select a different major or minor outside the requested prefix

#### Scenario: Custom and default nvm homes

- **WHEN** `NVM_DIR` is nonempty
- **THEN** installed versions SHALL be resolved from that directory
- **AND** when `NVM_DIR` is unset or empty, versions SHALL be resolved from `$HOME/.nvm`

#### Scenario: Missing or empty version file

- **WHEN** a worktree has no root `.nvmrc` or its contents are empty after trimming
- **THEN** the hook SHALL leave PATH unchanged and use the selected package manager as before
- **AND** it SHALL NOT search parent or child directories for another `.nvmrc`

#### Scenario: Unresolved pin uses ambient Node with a warning

- **WHEN** a nonempty pin has no usable installed numeric match, including unsupported aliases such as `lts/*`
- **THEN** the hook SHALL warn with the requested pin and state that ambient Node will be used
- **AND** it SHALL attempt the selected available package manager using unchanged PATH and report the install command's actual outcome

#### Scenario: Selected Node is visible in the log

- **WHEN** the hook activates a matching installed Node
- **THEN** the log SHALL contain a `[install-deps]` marker identifying the selected version before installation starts
