## Context

`dot_claude/settings.json.tmpl` is the chezmoi-managed template for `~/.claude/settings.json`. It currently contains plugin config, marketplace registrations, env vars, statusLine, and `effortLevel`. Three user behavior preferences are missing.

## Goals / Non-Goals

**Goals:**

- Add `alwaysThinkingEnabled`, `voiceEnabled`, and `skipDangerousModePermissionPrompt` as static `true` values to the template

**Non-Goals:**

- Making these preferences configurable via chezmoi template variables
- Changing any existing settings in the template

## Decisions

### Static values, no chezmoi templating

All three preferences are `true` across all machines. No need for conditional logic or `.chezmoi.osRelease` gating. If machine-specific overrides are ever needed, `settings.local.json` already serves that purpose.

### Placement alongside effortLevel

Group the new keys near `effortLevel` at the bottom of the JSON object. All four are "session behavior" preferences, distinct from the plugin/marketplace blocks above.

## Risks / Trade-offs

- [Minimal risk] `skipDangerousModePermissionPrompt` only takes effect when already using `--dangerously-skip-permissions` → Rollback via `settings.local.json` override or template revert
