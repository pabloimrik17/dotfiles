## ADDED Requirements

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
