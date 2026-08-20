## RENAMED Requirements

- FROM: `### Requirement: AoE session-status hooks are present in the settings template`
- TO: `### Requirement: AoE session-status hooks are present in the managed settings`

## MODIFIED Requirements

### Requirement: AoE session-status hooks are present in the managed settings

The chezmoi-managed Claude Code settings `hooks` block SHALL include Agent of Empires session-status hooks matching the set AoE 1.14.0 installs. `UserPromptSubmit` and `ElicitationResult` SHALL write `running`; `PreToolUse` SHALL write `waiting` when the invoked tool is `AskUserQuestion` and `running` for every other tool; `Notification` with matcher `permission_prompt|elicitation_dialog|agent_needs_input` SHALL write `waiting`; `Notification` with matcher `idle_prompt|agent_completed`, `Stop`, and `StopFailure` SHALL write `idle`; `PostToolUse` with matcher `AskUserQuestion` SHALL write `running`. `UserPromptSubmit` and `SessionStart` SHALL additionally run `aoe __extract-session-id`, gated on `$AOE_INSTANCE_ID` being set and `command -v aoe`. Each status command SHALL use AoE's hardened form: status words written to `/tmp/aoe-hooks-{{ .chezmoi.uid }}/$AOE_INSTANCE_ID/status` with `umask 077`, `$AOE_INSTANCE_ID` character-set validation, and owner/mode (`0700`, own uid) verification of both directories before writing.

The managed set SHALL track what AoE actually writes. AoE's installer sweeps and regenerates every matcher group in which all commands carry its own sentinel, so a template pinned to an older set is overwritten by AoE and then reimposed by the next `chezmoi apply`.

#### Scenario: Running-status hooks present

- **WHEN** the settings are materialized by chezmoi
- **THEN** the `hooks` block contains `UserPromptSubmit` and `ElicitationResult` entries whose command writes `running`

#### Scenario: PreToolUse branches on the question tool

- **WHEN** the settings are materialized by chezmoi
- **THEN** the `PreToolUse` hook command writes `waiting` for `AskUserQuestion` and `running` for every other tool

#### Scenario: Waiting-status hook covers agent input requests

- **WHEN** the settings are materialized by chezmoi
- **THEN** the `Notification` hook whose matcher includes `agent_needs_input` writes `waiting`

#### Scenario: Idle-status hooks cover completion and failure

- **WHEN** the settings are materialized by chezmoi
- **THEN** `Stop`, `StopFailure`, and the `Notification` hook whose matcher includes `agent_completed` each write `idle`

#### Scenario: Session-id extraction hooks present

- **WHEN** the settings are materialized by chezmoi
- **THEN** `UserPromptSubmit` and `SessionStart` contain a hook running `aoe __extract-session-id`, gated on `$AOE_INSTANCE_ID` and `command -v aoe`

#### Scenario: Question tool is reported

- **WHEN** the settings are materialized by chezmoi
- **THEN** a `PostToolUse` hook with matcher `AskUserQuestion` is present

#### Scenario: Re-apply after AoE writes is quiet

- **WHEN** AoE has installed its hooks into the live settings and `chezmoi diff` runs
- **THEN** no difference SHALL be reported in the AoE hook groups

## REMOVED Requirements

### Requirement: bd prime runs on SessionStart

**Reason**: The enabled `beads` plugin declares an identical `SessionStart` hook of its own, so the hand-written entry made `bd prime` run twice per session start — two store opens, each under its own timeout. Upstream's own setup path deliberately skips writing project hooks when the plugin is present, for exactly this reason.

**Migration**: Remove the hand-written `hooks.SessionStart` `bd prime` entry from the chezmoi-managed settings. The behaviour is preserved by the plugin. This makes the `beads` plugin load-bearing — see the added requirement below.

### Requirement: bd prime runs on PreCompact

**Reason**: As above — the `beads` plugin declares an identical `PreCompact` hook, so the managed entry was a duplicate.

**Migration**: Remove the hand-written `hooks.PreCompact` `bd prime` entry. The plugin supplies it.

## ADDED Requirements

### Requirement: Beads context priming depends on the beads plugin

With the hand-written `bd prime` hooks removed, beads context priming is supplied solely by the `beads` plugin. The plugin SHALL therefore remain enabled for as long as no managed `bd prime` hook exists.

Disabling the plugin without restoring the hooks silently removes context priming. Worse, with the plugin absent the beads CLI's own setup command will write hooks directly into the chezmoi-managed settings file, producing drift that this repo otherwise works hard to avoid.

#### Scenario: Plugin remains enabled

- **WHEN** the managed settings contain no `bd prime` hook
- **THEN** the `beads` plugin SHALL be listed as enabled

#### Scenario: Removing the plugin restores the hooks

- **WHEN** a future change disables the `beads` plugin
- **THEN** that change SHALL restore explicit `SessionStart` and `PreCompact` `bd prime` hooks in the same change

#### Scenario: Priming still occurs after the duplicate is removed

- **WHEN** a Claude Code session starts in a directory containing `.beads/`
- **THEN** `bd prime` SHALL run exactly once

### Requirement: beads telemetry is opted out user-globally

The beads user-global config (`~/.config/bd/config.yaml`) SHALL be chezmoi-managed and SHALL set `metrics.disabled: true`.

Keeping the plugin's `bd prime` hooks means `bd` runs on every SessionStart and PreCompact in every directory, and beads metrics default to on. `prime` is in beads' `firstRunNoticeSuppressedCommands`, so the consent banner never reaches a hook invocation — the collection would be silent. This repo opts out rather than accepting it.

The opt-out SHALL live in the user-global config rather than an environment variable, so it covers `bd` invocations that do not inherit a shell environment. beads resolves consent from the user-global config alone, so a project's `.beads/config.yaml` cannot re-enable it.

The managed file SHALL also carry `metrics.endpoint`. `EnsureUserConfigDefaults()` writes back any missing key on the next `bd` run; with both keys present it returns without writing, so the chezmoi-managed file does not drift.

#### Scenario: Metrics are disabled on a fresh machine

- **WHEN** `chezmoi apply` runs
- **THEN** `~/.config/bd/config.yaml` SHALL exist with `metrics.disabled: true`

#### Scenario: Running bd does not drift the managed file

- **WHEN** any `bd` command runs after apply
- **THEN** `chezmoi diff` SHALL report no change to `~/.config/bd/config.yaml`
