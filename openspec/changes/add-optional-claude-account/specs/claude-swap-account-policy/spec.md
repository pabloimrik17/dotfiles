## ADDED Requirements

### Requirement: Optional personal2 account

A personal machine SHALL permit, but never require, a `personal2` account. Its presence, absence, lapsed login or held-out state SHALL NOT affect setup completeness or produce setup warnings. In unpaid months it SHALL be held out of rotation with the upstream disable control. A work machine SHALL treat `personal2` like any other non-`work` account.

#### Scenario: Optional account absent

- **WHEN** a personal machine has `personal` and `work` enrolled and no `personal2`
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

### Requirement: Trial priority rotation orders accounts by tier

On a personal machine, autoswitch SHALL rotate by priority tier: `personal2` 100, `work` 50, `personal` 10. It SHALL keep or move to the highest-tier account that is below all of its lines, returning to a higher tier as soon as that tier is usable again, subject to the 300-second cooldown. Accounts held out of rotation SHALL be skipped. On a work machine automatic switching SHALL remain disabled.

#### Scenario: Higher tier becomes usable

- **WHEN** `work` is active below its lines and `personal2`'s 5-hour window resets below its line
- **THEN** the engine switches globally to `personal2` once the cooldown allows it

#### Scenario: Active account reaches its line

- **WHEN** `personal2` is active and reaches 95% on its 5-hour or 7-day window while `work` is below 60% on both
- **THEN** the engine switches globally to `work`

#### Scenario: Shared accounts are used in tier order

- **WHEN** `personal2` and `work` are at or above their lines and `personal` is below 80% on both windows
- **THEN** the engine switches globally to `personal`

#### Scenario: Optional account held out

- **WHEN** `personal2` is disabled or not enrolled
- **THEN** the rotation uses `work` and then `personal`

#### Scenario: Work machine has no rotation

- **WHEN** the menubar starts on a work machine
- **THEN** automatic switching remains off and the active identity remains `work`

### Requirement: Per-account lines protect shared accounts

On a personal machine each account SHALL carry its own switch line, applied to both its 5-hour and 7-day windows: `personal2` 95, `work` 60, `personal` 80. No account at or above any of its lines SHALL be chosen as an automatic target. Lines SHALL govern only departure and landing: when no account qualifies, the active account SHALL remain active until it is exhausted.

#### Scenario: Work above its line is skipped

- **WHEN** `personal2` is at its line, `work` is at 62% on its 7-day window and `personal` is at 40% on both windows
- **THEN** the engine switches to `personal`, not to `work`

#### Scenario: No account qualifies

- **WHEN** every account in rotation is at or above one of its lines
- **THEN** the engine stays on the active account and reports the upstream blocked state
- **AND** the active account keeps serving Claude Code past its line until it is exhausted

### Requirement: Rotation policy is a documented trial

The tiers and lines SHALL be marked as a trial policy chosen from the simulation published at https://claude.ai/artifact/6TgAbxVLuaYbFj3Psick5k (private to its owner) and recorded in the design of change `add-optional-claude-account`. Changes to them SHALL come through a later change informed by the user's feedback on real usage.

#### Scenario: Reader finds the trial status

- **WHEN** a maintainer reads this capability or the manual's claude-swap subsection
- **THEN** they learn that the tiers and lines are a trial
- **AND** they can follow the link to the simulation and the design that records its criteria

#### Scenario: Retuning goes through a change

- **WHEN** user feedback calls for different tiers or lines
- **THEN** a new OpenSpec change updates the repository values
- **AND** a runtime-only edit is not treated as the new policy

## MODIFIED Requirements

### Requirement: Account enrollment follows the immutable machine type

The guided setup SHALL use native claude-swap account aliases. A personal machine SHALL contain the required `personal` and `work`, SHALL permit the optional `personal2`, and SHALL finish its first enrollment with `personal` active. Completeness SHALL depend only on the required aliases, never on which account is active. A work machine SHALL contain only `work` and finish with it active. The guide SHALL warn not to run `/logout` before capturing the current account.

#### Scenario: Personal machine completes enrollment

- **WHEN** guided setup completes a first enrollment on a personal machine
- **THEN** `cswap list --json` identifies usable aliases `personal` and `work`, plus `personal2` only if the user enrolled it
- **AND** `cswap status --json` identifies `personal` as the active default account

#### Scenario: Work machine completes enrollment

- **WHEN** guided setup completes on a work machine
- **THEN** `cswap list --json` identifies `work` as the only managed account
- **AND** `cswap status --json` identifies it as active

#### Scenario: Unexpected account on work machine

- **WHEN** setup finds any managed account other than `work` on a work machine
- **THEN** it reports the machine as non-compliant and explains how to remove the account explicitly
- **AND** it does not delete or silently disable the credential

#### Scenario: Capturing the next account

- **WHEN** the guide asks the user to authenticate another Claude subscription
- **THEN** it explicitly warns that `/logout` can revoke the refresh token being preserved

#### Scenario: Setup check with another account active

- **WHEN** `personal` and `work` are enrolled on a personal machine and `work` or `personal2` is active
- **THEN** `claude-swap-setup --check` reports the setup complete
- **AND** no command switches the active account

### Requirement: Public autoswitch policy is declarative

Dotfiles SHALL manage only the public claude-swap `settings.json` with schema version 1 and this autoswitch policy: strategy `priority-consume-first`, threshold 85% for accounts without their own line, no `weeklyThreshold`, interval 60 seconds, cooldown 300 seconds, hysteresis 10 percentage points, API-key accounts excluded, unhealthy threshold three ticks, and no model-specific limit. Missing unspecified preferences, including the update check, SHALL use upstream defaults.

#### Scenario: Managed settings are rendered

- **WHEN** `chezmoi apply` runs on a supported Mac
- **THEN** `~/.claude-swap-backup/settings.json` contains the agreed autoswitch values and no `weeklyThreshold`
- **AND** claude-swap accepts the file without falling back to defaults because of invalid data

#### Scenario: Runtime edit drifts from policy

- **WHEN** a user temporarily changes a managed autoswitch value through claude-swap
- **THEN** `chezmoi diff` exposes the drift
- **AND** the next apply restores the repository value

#### Scenario: Account-wide windows only

- **WHEN** the engine evaluates account utilization
- **THEN** each account's line applies to both its 5-hour and 7-day windows
- **AND** model-specific limits, extra usage, and API-key accounts do not expand the eligible pool

### Requirement: Exhaustion and unhealthy telemetry degrade safely

If no account is below its lines, the system SHALL expose the upstream blocked state and stay on the active account without switch loops or paid fallback, even when the active account is exhausted. Three consecutive unknown readings for the active account SHALL permit failover only to an account with known usage below its lines. An unequivocal at-limit or authentication failure SHALL permit immediate failover to such an account.

#### Scenario: Both accounts exhausted

- **WHEN** every account in rotation is at or above one of its lines and the active account has zero usable headroom
- **THEN** the engine reports `BLOCKED`, keeps a visible status, and stays on the active account until a window recovers
- **AND** it does not select an API key, a paid extra-usage path, or an account above its lines

#### Scenario: One transient read failure

- **WHEN** one usage poll for the active account is unknown but Claude remains otherwise usable
- **THEN** no failover occurs on that first unhealthy tick

#### Scenario: Three consecutive unknown readings

- **WHEN** the active account has unknown usage for three consecutive engine ticks and another account has known usage below its lines
- **THEN** upstream failover may switch to that account

#### Scenario: No readable candidate

- **WHEN** the active account is unhealthy and no candidate has readable usable quota
- **THEN** the engine remains blocked rather than switching to an unknown destination

### Requirement: Manual choice and restart preserve the active identity

Manual switches SHALL change the global default identity, not launch an isolated `cswap run` session. While personal-machine autoswitch is on, a manual choice SHALL hold only until a higher tier is usable; to keep a lower-tier account, the user SHALL pause Auto-switch in the menu. Restarting the menu or Mac, or re-running setup, SHALL preserve the current active identity and persisted anti-flap state rather than forcing `personal`.

#### Scenario: User switches globally to work

- **WHEN** a user runs `cswap switch work` or the corresponding shell alias on a personal machine
- **THEN** Claude Code's global active credential changes to `work`
- **AND** no isolated profile is created

#### Scenario: Mac restarts while work is active

- **WHEN** a personal Mac restarts with `work` active below its lines and `personal2` is not usable
- **THEN** the menu resumes with `work` active
- **AND** recovery of `personal` alone does not force a switch

#### Scenario: Manual lower-tier choice while autoswitch is on

- **WHEN** the user switches to `work` while `personal2` is below its lines and Auto-switch is on
- **THEN** the engine switches back to `personal2` on a following tick

#### Scenario: Paused autoswitch keeps a manual choice

- **WHEN** the user pauses Auto-switch in the menu and switches to `work`
- **THEN** `work` stays active until the user switches again or resumes Auto-switch

### Requirement: Known upstream limitations remain visible

The documented operating contract SHALL state that autoswitch is best effort and that switch lines are not usage caps. It SHALL describe the accepted stale-usage risk under upstream issue #208, the manual-switch recovery path, Keychain access recovery for a login agent, and possible Remote Control or Artifact affinity to the prior identity. Dotfiles SHALL NOT carry a fork or custom watcher to mask those limitations.

#### Scenario: Usage endpoint returns HTTP 429

- **WHEN** upstream reuses stale last-good usage and an expected switch does not occur
- **THEN** the user can identify the known limitation from the documentation and perform a global manual switch

#### Scenario: Menubar cannot read Keychain

- **WHEN** the login agent cannot refresh credentials because macOS denies Keychain access
- **THEN** the recovery guide directs the user through the upstream terminal/menu recovery flow

#### Scenario: Long-lived identity-affine feature is in use

- **WHEN** Remote Control or an Artifact remains associated with the prior account after a switch
- **THEN** the manual warns that the feature may need to be restarted or republished under the active identity

#### Scenario: Active account passes its line

- **WHEN** no account in rotation is below its lines and the active account keeps climbing
- **THEN** the documentation explains that the engine keeps using the active account up to exhaustion
- **AND** it tells the user to slow down or switch manually, knowingly spending a reserve

## REMOVED Requirements

### Requirement: Autoswitch conserves a healthy active account

**Reason**: Under the old rule, the engine left a healthy account only at 85%, so `personal2` stayed idle while `work` drained. The trial priority rotation replaces it and returns to a higher tier as soon as that tier is usable.

**Migration**: See "Trial priority rotation orders accounts by tier" and "Per-account lines protect shared accounts". The work-machine scenario moves to "Trial priority rotation orders accounts by tier" as "Work machine has no rotation".
