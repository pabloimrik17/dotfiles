## Purpose

Install and lifecycle-manage a reproducible macOS `claude-swap` menubar deployment while keeping setup recoverable and service ownership with upstream.

## Requirements

### Requirement: macOS installs the exact claude-swap tool pin

On macOS, the install workflow SHALL install `claude-swap[menubar]` at the exact repository-declared version using a uv-managed Python. The initial pin SHALL be `0.26.0`. Non-macOS hosts SHALL skip the tool and state that this dotfiles integration is macOS-only.

#### Scenario: Fresh macOS install

- **WHEN** `cswap` is absent and the user accepts the applicable install group
- **THEN** the installer installs `claude-swap[menubar]==0.26.0` with a uv-managed Python
- **AND** `cswap --version` reports the exact pin

#### Scenario: Exact menubar-capable version already installed

- **WHEN** the installed `cswap` reports the repository-declared version
- **AND** its uv-managed interpreter can load the menubar runtime
- **THEN** the install workflow reports it satisfied and does not reinstall it

#### Scenario: Exact base package lacks the menubar runtime

- **WHEN** the installed `cswap` reports the repository-declared version
- **AND** its interpreter cannot load the menubar runtime
- **THEN** the install workflow reinstalls the exact `claude-swap[menubar]` requirement
- **AND** verifies both the version and menubar runtime before reporting success

#### Scenario: Linux apply

- **WHEN** the package workflow runs on a non-macOS host
- **THEN** it does not install `claude-swap`
- **AND** its manual-install summary identifies the integration as intentionally unsupported there

### Requirement: Installation failures are visible and recoverable

The install workflow SHALL verify the executable, exact version, and menubar runtime after installation. A missing `uv`, failed installation, version mismatch, or missing menubar runtime SHALL produce a named error and a non-success result for that managed step rather than reporting the tool installed.

#### Scenario: uv is unavailable

- **WHEN** the user accepts installation but `uv` is not on `PATH`
- **THEN** the workflow names `uv` as the missing prerequisite
- **AND** it records the claude-swap install step as failed

#### Scenario: Post-install version is wrong

- **WHEN** the installation command exits successfully but `cswap --version` does not report the declared pin
- **THEN** the workflow reports verification failure
- **AND** it does not report claude-swap as installed

### Requirement: Account bootstrap is offered once and remains re-runnable

The dotfiles SHALL install a dedicated guided claude-swap setup command. After a fresh or changed install, an interactive apply SHALL offer to run it when the role-specific account setup is incomplete; a non-interactive apply SHALL skip interaction and print the command to run later. The command SHALL remain safe to re-run for completion, repair, or reauthentication.

#### Scenario: Interactive apply finds incomplete setup

- **WHEN** the pinned tool is installed, a TTY is available, and required role-specific accounts are missing
- **THEN** the user is offered the guided setup during that apply

#### Scenario: Non-interactive apply finds incomplete setup

- **WHEN** required accounts are missing but no TTY is available
- **THEN** the apply does not block for input
- **AND** it prints the exact re-runnable setup command

#### Scenario: Setup is already complete

- **WHEN** the post-install offer runs on a machine whose required aliases and account constraints are satisfied
- **THEN** it does not ask the user to enroll the accounts again

#### Scenario: Repair after initial setup

- **WHEN** a stored credential later needs repair or reauthentication
- **THEN** the same setup command can be invoked directly without reinstalling all dotfiles packages

### Requirement: Upstream owns the menubar LaunchAgent

The guided setup SHALL install and verify the login service through `cswap menubar --install-service` on both machine types. Dotfiles SHALL NOT track its generated plist. After a declared version change, an already-installed service SHALL be refreshed so it runs the newly pinned executable.

#### Scenario: Service installed from upstream

- **WHEN** guided setup completes on a personal or work Mac
- **THEN** upstream creates `~/Library/LaunchAgents/com.cswap.menubar.plist`
- **AND** `cswap menubar --service-status` reports an installed service

#### Scenario: Pin changes with an existing service

- **WHEN** `chezmoi apply` replaces claude-swap with a newly declared version and the LaunchAgent already exists
- **THEN** the service is reinstalled or restarted through the upstream command
- **AND** its subsequent process uses the new installation

#### Scenario: No duplicate service owner

- **WHEN** the chezmoi source state is inspected
- **THEN** it contains no managed copy of `com.cswap.menubar.plist`

### Requirement: claude-swap uses the repo-pinned update path

The documented update path SHALL be a reviewed version-pin change followed by `chezmoi apply`. `update-extra` SHALL NOT run `cswap upgrade` or any other claude-swap updater.

#### Scenario: User checks update-extra

- **WHEN** `update-extra` executes
- **THEN** no claude-swap update command runs

#### Scenario: Version update is reviewed

- **WHEN** claude-swap is upgraded across machines
- **THEN** the repository pin changes first
- **AND** applying that revision converges each Mac on the same version
