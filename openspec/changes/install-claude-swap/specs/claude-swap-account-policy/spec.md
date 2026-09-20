## Purpose

Define the account, quota, security, and operator-control contract for global Claude Code identity switching on personal and work Macs.

## ADDED Requirements

### Requirement: Account enrollment follows the immutable machine type

The guided setup SHALL use native claude-swap account aliases. A personal machine SHALL contain `personal` and `work`, finish setup with `personal` active, and permit later global rotation between them. A work machine SHALL contain only `work` and finish with it active. The guide SHALL warn not to run `/logout` before capturing the current account.

#### Scenario: Personal machine completes enrollment

- **WHEN** guided setup completes on a personal machine
- **THEN** `cswap list --json` identifies usable aliases `personal` and `work`
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

### Requirement: Public autoswitch policy is declarative

Dotfiles SHALL manage only the public claude-swap `settings.json` with schema version 1 and this autoswitch policy: threshold 85%, interval 60 seconds, cooldown 300 seconds, hysteresis 10 percentage points, strategy `best`, API-key accounts excluded, unhealthy threshold three ticks, and no model-specific limit. Missing unspecified UI preferences SHALL continue to use upstream defaults.

#### Scenario: Managed settings are rendered

- **WHEN** `chezmoi apply` runs on a supported Mac
- **THEN** `~/.claude-swap-backup/settings.json` contains the agreed autoswitch values
- **AND** claude-swap accepts the file without falling back to defaults because of invalid data

#### Scenario: Runtime edit drifts from policy

- **WHEN** a user temporarily changes a managed autoswitch value through claude-swap
- **THEN** `chezmoi diff` exposes the drift
- **AND** the next apply restores the repository value

#### Scenario: Account-wide windows only

- **WHEN** the engine evaluates account utilization
- **THEN** its binding percentage uses the 5-hour and 7-day windows
- **AND** model-specific limits, extra usage, and API-key accounts do not expand the eligible pool

### Requirement: Autoswitch conserves a healthy active account

On a personal machine, the system SHALL keep the active account while its binding usage is below 85%, even if the inactive account has more headroom or recovers quota. At or above the threshold it SHALL use upstream `best` selection and hysteresis. On a work machine automatic switching SHALL remain disabled.

#### Scenario: Inactive account recovers

- **WHEN** the active personal-machine account is healthy and below 85% and the inactive account recovers quota
- **THEN** no switch occurs solely because of that recovery

#### Scenario: Active account reaches threshold

- **WHEN** the active account reaches 85% and the other account is an eligible materially better target
- **THEN** the engine switches globally to that target

#### Scenario: Both accounts are above threshold with headroom

- **WHEN** both accounts exceed 85% but one satisfies upstream's all-above-threshold recovery/headroom exception
- **THEN** the native `best` engine may select that materially better account without custom ranking code

#### Scenario: Work machine polls no rotation

- **WHEN** the menubar starts on a work machine
- **THEN** automatic switching remains off and the active identity remains `work`

### Requirement: Exhaustion and unhealthy telemetry degrade safely

If no account is eligible, the system SHALL expose the upstream blocked state and wait/retry without switch loops or paid fallback. Three consecutive unknown readings for the active account SHALL permit upstream failover only to an account with known usable quota. An unequivocal at-limit or authentication failure reported by the engine SHALL permit immediate failover.

#### Scenario: Both accounts exhausted

- **WHEN** both personal-machine accounts have zero usable headroom
- **THEN** the engine reports `BLOCKED`, keeps a visible status, and waits for recovery
- **AND** it does not select an API key or paid extra-usage path

#### Scenario: One transient read failure

- **WHEN** one usage poll for the active account is unknown but Claude remains otherwise usable
- **THEN** no failover occurs on that first unhealthy tick

#### Scenario: Three consecutive unknown readings

- **WHEN** the active account has unknown usage for three consecutive engine ticks and the other account has known usable quota
- **THEN** upstream failover may switch to the known account

#### Scenario: No readable candidate

- **WHEN** the active account is unhealthy and no candidate has readable usable quota
- **THEN** the engine remains blocked rather than switching to an unknown destination

### Requirement: Manual choice and restart preserve the active identity

Manual switches SHALL change the global default identity, not launch an isolated `cswap run` session. The selected account SHALL remain active until it later requires rotation. Restarting the menu or Mac SHALL preserve the current active identity and persisted anti-flap state rather than forcing `personal`.

#### Scenario: User switches globally to work

- **WHEN** a user runs `cswap switch work` or the corresponding shell alias on a personal machine
- **THEN** Claude Code's global active credential changes to `work`
- **AND** no isolated profile is created

#### Scenario: Mac restarts while work is active

- **WHEN** a personal Mac restarts with `work` active and that account remains healthy below threshold
- **THEN** the menu resumes with `work` active
- **AND** recovery of `personal` alone does not force a switch

### Requirement: Credentials and runtime state remain outside Git

Claude account credentials SHALL be owned by claude-swap and Claude Code, preferring macOS Keychain. The upstream `0600` local credential fallback is permitted when Keychain is unavailable. Dotfiles SHALL NOT import, export, template, or commit credentials, plaintext exports, cache, quarantine data, autoswitch state, or the backup root as a whole.

#### Scenario: Keychain is available

- **WHEN** an account is captured on macOS with Keychain access
- **THEN** claude-swap stores its backup through the macOS credential backend
- **AND** no secret appears in the chezmoi source state

#### Scenario: Upstream uses its file fallback

- **WHEN** Keychain is unavailable and claude-swap falls back to local credential files
- **THEN** the files remain under the runtime-owned backup directory with owner-only permissions
- **AND** chezmoi does not add them to source state

#### Scenario: Plaintext export exists

- **WHEN** a user creates a `cswap export`
- **THEN** the documentation identifies it as sensitive plaintext
- **AND** the repository never treats it as a bootstrap artifact

### Requirement: Menubar activation uses the supported UI boundary

Dotfiles SHALL leave `menubar_settings.json` application-owned. After a side-effect-free dry run, personal-machine setup SHALL instruct the user to enable **Settings → Auto-switch accounts** once; work-machine setup SHALL instruct the user to leave it disabled. Pause, notifications, and manual controls SHALL use the upstream menu rather than a second daemon or notification layer.

#### Scenario: Personal activation follows dry-run

- **WHEN** both personal-machine accounts have been enrolled
- **THEN** setup runs or directs the user through `cswap auto --dry-run` before automatic changes are enabled
- **AND** activation occurs through the menu toggle rather than an edit to `menubar_settings.json`

#### Scenario: Work menu remains informational

- **WHEN** setup completes on a work machine
- **THEN** the menubar and login service are available for status and supported controls
- **AND** **Auto-switch accounts** remains off

#### Scenario: User pauses automatic switching

- **WHEN** the user disables auto-switch from the personal machine's menu
- **THEN** the menu-hosted engine stops making automatic account changes
- **AND** no parallel dotfiles-managed engine continues switching

### Requirement: Known upstream limitations remain visible

The documented operating contract SHALL state that autoswitch is best effort. It SHALL describe the accepted stale-usage risk under upstream issue #208, the manual-switch recovery path, Keychain access recovery for a login agent, and possible Remote Control or Artifact affinity to the prior identity. Dotfiles SHALL NOT carry a fork or custom watcher to mask those limitations.

#### Scenario: Usage endpoint returns HTTP 429

- **WHEN** upstream reuses stale last-good usage and an expected switch does not occur
- **THEN** the user can identify the known limitation from the documentation and perform a global manual switch

#### Scenario: Menubar cannot read Keychain

- **WHEN** the login agent cannot refresh credentials because macOS denies Keychain access
- **THEN** the recovery guide directs the user through the upstream terminal/menu recovery flow

#### Scenario: Long-lived identity-affine feature is in use

- **WHEN** Remote Control or an Artifact remains associated with the prior account after a switch
- **THEN** the manual warns that the feature may need to be restarted or republished under the active identity

