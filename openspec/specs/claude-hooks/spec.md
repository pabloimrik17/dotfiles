# Capability: claude-hooks

## Purpose

Claude Code hook configuration managed by chezmoi — hook definitions in the settings template for session lifecycle events.

## Requirements

### Requirement: bd CLI is installed via brew

The brew packages list in `run_once_install-packages.sh.tmpl` SHALL include `beads` (the Homebrew formula that provides the `bd` CLI) so that the beads CLI is available on PATH for hooks to function. The `pkg_bin` mapping SHALL resolve `beads` to `bd` for the already-installed check.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` runs the install script and the user confirms the brew packages group
- **THEN** `bd` is installed via `brew install beads`

#### Scenario: Already installed

- **WHEN** the `bd` command is already available on the machine
- **THEN** the brew packages group skips `beads` installation and reports it as already installed

### Requirement: bd prime runs on SessionStart

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include a `hooks.SessionStart` entry that runs `bd prime` with an empty matcher (global scope).

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with a `hooks.SessionStart` array containing a command hook that runs `bd prime`

#### Scenario: Session starts in a beads-enabled project

- **WHEN** a Claude Code session starts in a directory containing `.beads/` and `bd` is installed
- **THEN** the `bd prime` hook executes and initializes beads context

#### Scenario: Session starts in a non-beads project

- **WHEN** a Claude Code session starts in a directory without `.beads/` and `bd` is installed
- **THEN** the `bd prime` hook executes and exits as a no-op without errors

### Requirement: bd prime runs on PreCompact

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include a `hooks.PreCompact` entry that runs `bd prime` with an empty matcher (global scope).

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with a `hooks.PreCompact` array containing a command hook that runs `bd prime`

#### Scenario: Context compaction in a beads-enabled project

- **WHEN** Claude Code triggers context compaction in a directory containing `.beads/` and `bd` is installed
- **THEN** the `bd prime` hook executes and re-primes beads context before compaction

#### Scenario: Context compaction in a non-beads project

- **WHEN** Claude Code triggers context compaction in a directory without `.beads/` and `bd` is installed
- **THEN** the `bd prime` hook executes and exits as a no-op without errors

### Requirement: AoE session-status hooks are present in the settings template

The chezmoi-managed `dot_claude/settings.json.tmpl` `hooks` block SHALL include Agent of Empires session-status hooks that report Claude Code session state to AoE. `UserPromptSubmit`, `PreToolUse`, and `ElicitationResult` SHALL write `running`; `Notification` (matcher `permission_prompt|elicitation_dialog`) SHALL write `waiting`; `Stop` SHALL write `idle`. Each hook command SHALL write its status word to `/tmp/aoe-hooks/$AOE_INSTANCE_ID/status`. These hooks SHALL coexist with the existing `bd prime` hooks (`SessionStart`, `PreCompact`).

#### Scenario: Running-status hooks present

- **WHEN** the settings template is rendered by chezmoi
- **THEN** the `hooks` block contains `UserPromptSubmit`, `PreToolUse`, and `ElicitationResult` entries whose command writes `running` to `/tmp/aoe-hooks/$AOE_INSTANCE_ID/status`

#### Scenario: Waiting-status hook present with matcher

- **WHEN** the settings template is rendered by chezmoi
- **THEN** the `Notification` hook with matcher `permission_prompt|elicitation_dialog` writes `waiting`

#### Scenario: Idle-status hook present

- **WHEN** the settings template is rendered by chezmoi
- **THEN** the `Stop` hook writes `idle`

#### Scenario: AoE hooks do not displace bd prime hooks

- **WHEN** the settings template is rendered by chezmoi
- **THEN** the `SessionStart` and `PreCompact` hooks still run `bd prime` alongside the AoE status hooks

### Requirement: AoE status hooks self-gate on $AOE_INSTANCE_ID

Each AoE session-status hook command SHALL begin with a guard equivalent to `[ -n "$AOE_INSTANCE_ID" ] || exit 0`, so the hook is a no-op in any Claude Code session not launched by AoE.

#### Scenario: No-op outside an AoE session

- **WHEN** a Claude Code session runs with `$AOE_INSTANCE_ID` unset
- **THEN** each AoE status hook exits 0 immediately and writes nothing
