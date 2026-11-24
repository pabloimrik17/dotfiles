## MODIFIED Requirements

### Requirement: macOS installs the exact claude-swap tool pin

On macOS, the install workflow SHALL install `claude-swap[menubar]` at the exact repository-declared version using a uv-managed Python. The pin SHALL be `1.2.0`. Non-macOS hosts SHALL skip the tool and state that this dotfiles integration is macOS-only.

#### Scenario: Fresh macOS install

- **WHEN** `cswap` is absent and the user accepts the applicable install group
- **THEN** the installer installs `claude-swap[menubar]==1.2.0` with a uv-managed Python
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

- **WHEN** `chezmoi apply` runs on a Mac with `cswap 0.29.0` installed
- **THEN** the installer replaces it with `1.2.0`
- **AND** the existing accounts, aliases, hold-outs, tiers, lines and credentials remain usable

### Requirement: Account bootstrap is offered once and remains re-runnable

The dotfiles SHALL install a dedicated guided claude-swap setup command. After a fresh or changed install, an interactive apply SHALL offer it when the required accounts are incomplete; a non-interactive apply SHALL print the command instead. The command SHALL stay safe to re-run, SHALL enroll `work2` or the optional `personal2` on request, and SHALL restore the previously active account after any capture outside a first enrollment.

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
- **AND** `--reauth work` and `--reauth work2` on both machine types, and `--reauth personal` and `--reauth personal2` on a personal machine, recapture that alias in its existing slot

#### Scenario: Optional account enrollment

- **WHEN** the user runs `claude-swap-setup --enroll personal2` on a personal machine
- **THEN** the guide captures the current login as `personal2` with the `/logout` warning
- **AND** the same command is rejected on a work machine

#### Scenario: Capture restores the previous account

- **WHEN** `work` is active and the user completes `--enroll personal2`, `--reauth personal2` or `--reauth work2`
- **THEN** the setup switches back to `work` after the capture
- **AND** it does not force the first-enrollment default

#### Scenario: Current login belongs to another account

- **WHEN** the user confirms a capture while the current Claude login is already enrolled under a different alias or slot
- **THEN** the setup refuses before calling `cswap add`, and every account keeps its alias and slot
- **AND** it tells the user to `/login` as the intended account first

#### Scenario: Reauth login is not enrolled

- **WHEN** the user confirms `--reauth` while the current Claude login is not an enrolled account
- **THEN** the setup refuses before calling `cswap add`, and the alias keeps its slot and stored login

#### Scenario: Recapture keeps the runtime policy

- **WHEN** `--reauth` recaptures an account that is held out of rotation or has a tier and line
- **THEN** after the run the account is still held out and has its declared tier and line

#### Scenario: work2 enrollment on request

- **WHEN** the user runs `claude-swap-setup --enroll work2` on a personal or work machine
- **THEN** the guide captures the current login as `work2` with the `/logout` warning
- **AND** an already enrolled `work2` is left unchanged

#### Scenario: Unaliased login adopted as work2

- **WHEN** on a personal machine the current Claude login is an enrolled account without an alias and the setup captures `work2`
- **THEN** that account receives the `work2` alias in its existing slot
- **AND** no second record is created

## ADDED Requirements

### Requirement: Setup applies each machine type's rotation policy

Every guided setup run and `--apply-policy` SHALL apply the repository-declared tiers and per-account lines of the machine type to each enrolled account through upstream commands, idempotently. It SHALL skip a declared account that is not enrolled and SHALL NOT write `sequence.json` directly. A change to the declared values SHALL be applied by the next `chezmoi apply` without prompting.

#### Scenario: Personal policy applied on enrollment

- **WHEN** guided setup finishes on a personal machine with `personal`, `work`, `work2` and `personal2` enrolled
- **THEN** upstream reports tiers `personal2` 100, `work` 50, `work2` 50, `personal` 10
- **AND** lines `personal2` 95, `work` 70, `work2` 70, `personal` 80

#### Scenario: Work policy applied on enrollment

- **WHEN** guided setup finishes on a work machine with `work` and `work2` enrolled
- **THEN** upstream reports the same tier for `work` and `work2`
- **AND** lines `work` 95 and `work2` 95

#### Scenario: Re-run converges drift

- **WHEN** a tier or line was changed by hand and the user re-runs `claude-swap-setup`
- **THEN** the repository values are restored
- **AND** no account is enrolled again

#### Scenario: Declared account not enrolled

- **WHEN** guided setup runs on a personal machine without `personal2`, or on any machine before `work2` is enrolled
- **THEN** it applies tiers and lines to the enrolled accounts only
- **AND** it does not fail because an account is missing

#### Scenario: Declared values change

- **WHEN** the repository changes a tier or line and `chezmoi apply` runs on either machine type, with or without a TTY
- **THEN** the new values are applied to the enrolled accounts without a prompt
- **AND** no account is enrolled, reauthenticated or switched

## REMOVED Requirements

### Requirement: Setup applies the runtime rotation policy

**Reason**: Work machines now receive a rotation policy; the requirement covered personal machines only.

**Migration**: See "Setup applies each machine type's rotation policy". The next `chezmoi apply` applies the declared values on both machine types.
