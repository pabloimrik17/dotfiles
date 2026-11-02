## ADDED Requirements

### Requirement: Setup applies the runtime rotation policy

On a personal machine, every guided setup run SHALL apply the repository-declared priority tiers and per-account lines to each enrolled account through upstream commands, idempotently. It SHALL skip a `personal2` that is not enrolled and SHALL NOT write `sequence.json` directly. A work machine SHALL receive no tiers or lines. A change to the declared values SHALL be applied by the next `chezmoi apply` without prompting.

#### Scenario: Policy applied on enrollment

- **WHEN** guided setup finishes on a personal machine with `personal`, `work` and `personal2` enrolled
- **THEN** upstream reports tiers `personal2` 100, `work` 50, `personal` 10
- **AND** lines `personal2` 95, `work` 60, `personal` 80

#### Scenario: Re-run converges drift

- **WHEN** a tier or line was changed by hand and the user re-runs `claude-swap-setup`
- **THEN** the repository values are restored
- **AND** no account is enrolled again

#### Scenario: personal2 not enrolled

- **WHEN** guided setup runs on a personal machine without `personal2`
- **THEN** it applies tiers and lines to `personal` and `work` only
- **AND** it does not fail because `personal2` is missing

#### Scenario: Work machine receives no rotation policy

- **WHEN** guided setup runs on a work machine
- **THEN** it sets no tier or per-account line

#### Scenario: Declared values change

- **WHEN** the repository changes a tier or line and `chezmoi apply` runs, with or without a TTY
- **THEN** the new values are applied to the enrolled accounts without a prompt
- **AND** no account is enrolled, reauthenticated or switched

## MODIFIED Requirements

### Requirement: macOS installs the exact claude-swap tool pin

On macOS, the install workflow SHALL install `claude-swap[menubar]` at the exact repository-declared version using a uv-managed Python. The pin SHALL be `0.29.0`. Non-macOS hosts SHALL skip the tool and state that this dotfiles integration is macOS-only.

#### Scenario: Fresh macOS install

- **WHEN** `cswap` is absent and the user accepts the applicable install group
- **THEN** the installer installs `claude-swap[menubar]==0.29.0` with a uv-managed Python
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

#### Scenario: Upgrade from the previous pin

- **WHEN** `chezmoi apply` runs on a Mac with `cswap 0.26.0` installed
- **THEN** the installer replaces it with `0.29.0`
- **AND** the existing accounts, aliases and credentials remain usable

### Requirement: Account bootstrap is offered once and remains re-runnable

The dotfiles SHALL install a dedicated guided claude-swap setup command. After a fresh or changed install, an interactive apply SHALL offer it when the required accounts are incomplete; a non-interactive apply SHALL print the command instead. The command SHALL stay safe to re-run, SHALL enroll or reauthenticate the optional `personal2` only on request, and SHALL restore the previously active account after any capture.

#### Scenario: Interactive apply finds incomplete setup

- **WHEN** the pinned tool is installed, a TTY is available, and required role-specific accounts are missing
- **THEN** the user is offered the guided setup during that apply

#### Scenario: Non-interactive apply finds incomplete setup

- **WHEN** required accounts are missing but no TTY is available
- **THEN** the apply does not block for input
- **AND** it prints the exact re-runnable setup command

#### Scenario: Setup is already complete

- **WHEN** the post-install offer runs on a machine whose required aliases and account constraints are satisfied, whichever account is active
- **THEN** it does not ask the user to enroll the accounts again

#### Scenario: Repair after initial setup

- **WHEN** a stored credential later needs repair or reauthentication
- **THEN** the same setup command can be invoked directly without reinstalling all dotfiles packages
- **AND** `--reauth personal`, `--reauth work` and, on a personal machine, `--reauth personal2` recapture that alias in its existing slot

#### Scenario: Optional account enrollment

- **WHEN** the user runs `claude-swap-setup --enroll personal2` on a personal machine
- **THEN** the guide captures the current login as `personal2` with the `/logout` warning
- **AND** the same command is rejected on a work machine

#### Scenario: Capture restores the previous account

- **WHEN** `work` is active and the user completes `--enroll personal2` or `--reauth personal2`
- **THEN** the setup switches back to `work` after the capture
- **AND** it does not force `personal`

### Requirement: Upstream owns the menubar LaunchAgent

The guided setup SHALL install and verify the login service through `cswap menubar --install-service` on both machine types. Dotfiles SHALL NOT track its generated plist or the menubar app wrapper upstream builds under `/Applications`. After a declared version change, an already-installed service SHALL be refreshed so it runs the newly pinned executable.

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

#### Scenario: App wrapper stays upstream-owned

- **WHEN** the menubar starts and builds `/Applications/claude-swap Menubar.app`
- **THEN** chezmoi neither tracks nor removes that bundle
- **AND** setup verification still passes through `cswap menubar --service-status`
