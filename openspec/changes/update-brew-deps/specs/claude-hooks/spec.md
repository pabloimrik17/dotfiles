# claude-hooks Delta

## MODIFIED Requirements

### Requirement: AoE session-status hooks are present in the settings template

The chezmoi-managed `dot_claude/settings.json.tmpl` `hooks` block SHALL carry the AoE 1.12 session-status hook set verbatim (as written by `aoe` itself, marked `# aoe-hooks`), so `chezmoi apply` never downgrades hooks that AoE re-injects on session start. Specifically: `UserPromptSubmit`, `PreToolUse`, and `ElicitationResult` SHALL write `running`; `Notification` SHALL write `waiting` (matcher `permission_prompt|elicitation_dialog`) and `idle` (matcher `idle_prompt`); `Stop` and `StopFailure` SHALL write `idle`; `UserPromptSubmit` and `SessionStart` SHALL additionally run `aoe __extract-session-id` (gated on `aoe` being installed). Each status command SHALL use AoE's hardened form: status words written to `/tmp/aoe-hooks-{{ .chezmoi.uid }}/$AOE_INSTANCE_ID/status` with `umask 077`, `$AOE_INSTANCE_ID` character-set validation, and owner/mode (`0700`, own uid) verification of both directories before writing. These hooks SHALL coexist with the existing `bd prime` hooks (`SessionStart`, `PreCompact`).

#### Scenario: Running-status hooks present

- **WHEN** the settings template is rendered by chezmoi
- **THEN** the `hooks` block contains `UserPromptSubmit`, `PreToolUse`, and `ElicitationResult` entries whose command writes `running` to `/tmp/aoe-hooks-<uid>/$AOE_INSTANCE_ID/status`

#### Scenario: Waiting- and idle-notification hooks present with matchers

- **WHEN** the settings template is rendered by chezmoi
- **THEN** the `Notification` hook with matcher `permission_prompt|elicitation_dialog` writes `waiting` AND the `Notification` hook with matcher `idle_prompt` writes `idle`

#### Scenario: Idle-status hooks present

- **WHEN** the settings template is rendered by chezmoi
- **THEN** the `Stop` and `StopFailure` hooks write `idle`

#### Scenario: Session-id extraction hooks present

- **WHEN** the settings template is rendered by chezmoi
- **THEN** `UserPromptSubmit` and `SessionStart` contain a hook running `aoe __extract-session-id`, gated on `$AOE_INSTANCE_ID` and `command -v aoe`

#### Scenario: Render matches what AoE writes (no apply churn)

- **WHEN** AoE has injected its hooks into the live `~/.claude/settings.json` and `chezmoi diff` runs
- **THEN** the hooks block reports no differences (uid rendered via `{{ .chezmoi.uid }}` matches the live `/tmp/aoe-hooks-<uid>` base)

#### Scenario: AoE hooks do not displace bd prime hooks

- **WHEN** the settings template is rendered by chezmoi
- **THEN** the `SessionStart` and `PreCompact` hooks still run `bd prime` alongside the AoE status hooks
