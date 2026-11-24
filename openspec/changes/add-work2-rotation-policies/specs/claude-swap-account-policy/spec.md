## MODIFIED Requirements

### Requirement: Account enrollment follows the immutable machine type

The guided setup SHALL use native claude-swap account aliases. A personal machine SHALL contain the required `personal`, `work` and `work2`, SHALL permit the optional `personal2`, and SHALL finish its first enrollment with `personal` active. Completeness SHALL depend only on the required aliases, never on which account is active. A work machine SHALL contain only the required `work` and `work2` and SHALL finish its first enrollment with `work` active. The guide SHALL warn not to run `/logout` before capturing the current account.

#### Scenario: Personal machine completes enrollment

- **WHEN** guided setup completes a first enrollment on a personal machine
- **THEN** `cswap list --json` identifies usable aliases `personal`, `work` and `work2`, plus `personal2` only if the user enrolled it
- **AND** `cswap status --json` identifies `personal` as the active default account

#### Scenario: Work machine completes enrollment

- **WHEN** guided setup completes a first enrollment on a work machine
- **THEN** `cswap list --json` identifies `work` and `work2` as the only managed accounts
- **AND** `cswap status --json` identifies `work` as active

#### Scenario: Unexpected account on work machine

- **WHEN** setup finds any managed account other than `work` and `work2` on a work machine
- **THEN** it reports the machine as non-compliant and explains how to remove the account explicitly
- **AND** it does not delete or silently disable the credential

#### Scenario: Capturing the next account

- **WHEN** the guide asks the user to authenticate another Claude subscription
- **THEN** it explicitly warns that `/logout` can revoke the refresh token being preserved

#### Scenario: Setup check with another account active

- **WHEN** every required account is enrolled and an account other than the first-enrollment default is active
- **THEN** `claude-swap-setup --check` reports the setup complete
- **AND** no command switches the active account

#### Scenario: Existing machine lacks work2

- **WHEN** a personal or work machine enrolled before `work2` existed has every other required account
- **THEN** `claude-swap-setup --check` reports the setup incomplete
- **AND** the guided setup captures only `work2` and leaves the other accounts unchanged

### Requirement: Manual choice and restart preserve the active identity

Manual switches SHALL change the global default identity, not launch an isolated `cswap run` session. While autoswitch is on, a manual choice SHALL hold only until the engine prefers another account: a usable higher tier, or within a tier a usable account whose weekly window resets sooner. To keep the choice, the user SHALL pause Auto-switch in the menu. Restarting the menu or Mac, or re-running setup, SHALL preserve the current active identity and persisted anti-flap state rather than forcing the first-enrollment default.

#### Scenario: User switches globally to work

- **WHEN** a user runs `cswap switch work` or the corresponding shell alias
- **THEN** Claude Code's global active credential changes to `work`
- **AND** no isolated profile is created

#### Scenario: Mac restarts while work is active

- **WHEN** a personal Mac restarts with `work` active below its lines, `personal2` not usable, and `work`'s weekly window resetting before `work2`'s
- **THEN** the menu resumes with `work` active
- **AND** recovery of `personal` alone does not force a switch

#### Scenario: Manual lower-tier choice while autoswitch is on

- **WHEN** the user switches a personal Mac to `work` while `personal2` is below its lines and Auto-switch is on
- **THEN** the engine switches back to `personal2` on a following tick

#### Scenario: Paused autoswitch keeps a manual choice

- **WHEN** the user pauses Auto-switch in the menu and switches to another account
- **THEN** that account stays active until the user switches again or resumes Auto-switch

#### Scenario: Manual choice within the work tier

- **WHEN** the user switches a work Mac to the work account whose weekly window resets later while the other is below its lines and Auto-switch is on
- **THEN** the engine switches back to the account that resets sooner on a following tick

### Requirement: Optional personal2 account

A personal machine SHALL permit, but never require, a `personal2` account. Its presence, absence, lapsed login or held-out state SHALL NOT affect setup completeness or produce setup warnings. In unpaid months it SHALL be held out of rotation with the upstream disable control. A work machine SHALL treat `personal2` like any other account outside the work accounts.

#### Scenario: Optional account absent

- **WHEN** a personal machine has `personal`, `work` and `work2` enrolled and no `personal2`
- **THEN** `claude-swap-setup --check` reports the setup complete

#### Scenario: Optional account lapsed

- **WHEN** `personal2` is enrolled but its subscription is unpaid or its login has expired
- **THEN** `claude-swap-setup --check` reports the setup complete
- **AND** the setup prints no warning about `personal2`

#### Scenario: Unpaid month

- **WHEN** the user holds `personal2` out of rotation with `cswap disable personal2` or the menu control
- **THEN** autoswitch never selects `personal2`
- **AND** an explicit `cswap switch personal2` still activates it

#### Scenario: personal2 on a work machine

- **WHEN** setup finds `personal2` on a work machine
- **THEN** it reports the machine as non-compliant and explains how to remove the account explicitly
- **AND** it does not delete or silently disable the credential

### Requirement: Per-account lines protect shared accounts

Each account SHALL carry its own switch line per machine type, applied to both its 5-hour and 7-day windows. On a personal machine the lines SHALL be `personal2` 95, `work` 70, `work2` 70 and `personal` 80. On a work machine they SHALL be `work` 95 and `work2` 95. No account at or above any of its lines SHALL be chosen as an automatic target. Lines SHALL govern only departure and landing: when no account qualifies, the active account SHALL remain active until it is exhausted.

#### Scenario: Work above its line is skipped

- **WHEN** on a personal machine `personal2` is at its line, `work` is at 72 % and `work2` at 75 % on their 7-day windows, and `personal` is at 40 % on both windows
- **THEN** the engine switches to `personal`, not to a work account

#### Scenario: No account qualifies

- **WHEN** every account in rotation is at or above one of its lines
- **THEN** the engine stays on the active account and reports the upstream blocked state
- **AND** the active account keeps serving Claude Code past its line until it is exhausted

#### Scenario: Work machine keeps a safety margin

- **WHEN** on a work machine the active work account reaches 95 % on its 5-hour or 7-day window and the other work account is below 95 % on both
- **THEN** the engine switches globally to the other work account

### Requirement: Rotation policy is a documented trial

The tiers and lines of both machine types SHALL be marked as a trial policy, chosen from the two-machine simulation recorded in the design of change `add-work2-rotation-policies` and kept in that change's `simulation/` folder. Changes to them SHALL come through a later change informed by real usage, reviewed from the claude-swap log.

#### Scenario: Reader finds the trial status

- **WHEN** a maintainer reads this capability or the manual's claude-swap subsection
- **THEN** they learn that the tiers and lines of both machine types are a trial
- **AND** they can follow a reference to the simulation and the design that records its criteria

#### Scenario: Retuning goes through a change

- **WHEN** usage evidence calls for different tiers or lines
- **THEN** a new OpenSpec change updates the repository values
- **AND** a runtime-only edit is not treated as the new policy

## ADDED Requirements

### Requirement: Personal machine rotation orders accounts by tier

On a personal machine, autoswitch SHALL use `priority-consume-first` with tiers `personal2` 100, `work` 50, `work2` 50 and `personal` 10. It SHALL keep or move to the highest-tier account below all of its lines, returning to a higher tier as soon as one is usable, subject to the 300-second cooldown. Within a tier it SHALL prefer the account whose weekly window resets sooner. Accounts held out of rotation SHALL be skipped.

#### Scenario: Higher tier becomes usable

- **WHEN** `work` is active below its lines and `personal2`'s 5-hour window resets below its line
- **THEN** the engine switches globally to `personal2` once the cooldown allows it

#### Scenario: Active account reaches its line

- **WHEN** `personal2` is active and reaches 95 % on its 5-hour or 7-day window while a work account is below 70 % on both
- **THEN** the engine switches globally to that work account

#### Scenario: Sooner reset first within the work tier

- **WHEN** `personal2` is above its line and both work accounts are below 70 % on both windows
- **THEN** the engine selects the work account whose weekly window resets sooner

#### Scenario: Shared accounts are used in tier order

- **WHEN** `personal2`, `work` and `work2` are at or above their lines and `personal` is below 80 % on both windows
- **THEN** the engine switches globally to `personal`

#### Scenario: Optional account held out

- **WHEN** `personal2` is disabled or not enrolled
- **THEN** the rotation uses the work accounts and then `personal`

### Requirement: Work machine rotates between the work accounts

On a work machine, autoswitch SHALL be on and SHALL use `priority-consume-first` with `work` and `work2` at the same tier. It SHALL keep or move to the work account below all of its lines whose weekly window resets sooner, subject to the 300-second cooldown, and SHALL never choose an account above a line.

#### Scenario: Sooner reset is consumed first

- **WHEN** both work accounts are below 95 % on both windows and the inactive one's weekly window resets sooner
- **THEN** the engine switches globally to that account once the cooldown allows it

#### Scenario: Both work accounts above their lines

- **WHEN** both work accounts are at or above 95 % on one of their windows
- **THEN** the engine stays on the active account and reports the upstream blocked state

#### Scenario: Shared settings serve both machine types

- **WHEN** `chezmoi apply` renders the managed `settings.json` on a work machine
- **THEN** it holds the same strategy and global values as on a personal machine

### Requirement: Heavy work weeks hold the work accounts out on the personal machine

The documented operating contract SHALL state that the policy keeps the work Mac wall-free up to 1.5 times its measured weekday demand, not beyond. For a heavier week, the user SHALL hold `work` and `work2` out of the personal machine's rotation with the upstream disable control from the weekend before, and re-enable them afterwards. The setup SHALL NOT re-enable or warn about held-out work accounts.

#### Scenario: Work accounts held out on the personal machine

- **WHEN** the user runs `cswap disable work` and `cswap disable work2` on a personal machine
- **THEN** that machine's autoswitch never selects either work account
- **AND** an explicit `cswap switch work` still activates it

#### Scenario: Setup keeps the hold-out

- **WHEN** the work accounts are held out and `claude-swap-setup`, `--check` or `--apply-policy` runs on the personal machine
- **THEN** the setup reports completeness as usual and both accounts stay held out

#### Scenario: Reader learns the limit

- **WHEN** a maintainer reads the manual's claude-swap subsection
- **THEN** it states the 1.5× limit and the hold-out step for heavier weeks

### Requirement: Setup activates autoswitch through the upstream service

Dotfiles SHALL leave `menubar_settings.json` application-owned. On both machine types, the setup run that completes a missing required account SHALL run a side-effect-free dry run and then install the service with `cswap menubar --install-service --auto-switch`. Other runs SHALL install or refresh the service without the flag. Pause, notifications and manual controls SHALL use the upstream menu rather than a second daemon or notification layer.

#### Scenario: Activation follows the dry run

- **WHEN** a guided setup run enrolls the last missing required account on a personal or work machine
- **THEN** it runs `cswap auto --once --dry-run` before installing the service with `--auto-switch`
- **AND** it does not edit `menubar_settings.json`

#### Scenario: Repair run keeps a pause

- **WHEN** the user has paused Auto-switch in the menu and later runs `claude-swap-setup` or `--reauth` on a complete setup
- **THEN** the service is installed or refreshed without `--auto-switch`
- **AND** Auto-switch stays paused

#### Scenario: User pauses automatic switching

- **WHEN** the user disables auto-switch from the menu
- **THEN** the menu-hosted engine stops making automatic account changes
- **AND** no parallel dotfiles-managed engine continues switching

## REMOVED Requirements

### Requirement: Trial priority rotation orders accounts by tier

**Reason**: The single personal-machine rotation, with automatic switching disabled on work machines, is replaced by one rotation policy per machine type.

**Migration**: See "Personal machine rotation orders accounts by tier" and "Work machine rotates between the work accounts". The setup applies the new tiers and lines on the next `chezmoi apply`.

### Requirement: Menubar activation uses the supported UI boundary

**Reason**: Work machines now enable autoswitch, and the setup enables it through the upstream service flag instead of asking for the menu toggle.

**Migration**: See "Setup activates autoswitch through the upstream service". Pausing from the menu keeps working and is respected by repair runs.
