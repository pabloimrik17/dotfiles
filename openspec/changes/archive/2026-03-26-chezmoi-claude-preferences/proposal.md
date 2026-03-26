## Why

Three user-level Claude Code preferences (`alwaysThinkingEnabled`, `voiceEnabled`, `skipDangerousModePermissionPrompt`) are part of the daily workflow but missing from the chezmoi template, so they aren't portable across machines.

## What Changes

- Add `alwaysThinkingEnabled: true` to `dot_claude/settings.json.tmpl` — forces extended thinking on every request
- Add `voiceEnabled: true` — enables voice input/output
- Add `skipDangerousModePermissionPrompt: true` — skips the confirmation dialog when starting with `--dangerously-skip-permissions`

## Capabilities

### New Capabilities

- `claude-user-preferences`: User behavior preferences (thinking mode, voice, dangerous-mode prompt skip) managed via chezmoi template

### Modified Capabilities

## Impact

- `dot_claude/settings.json.tmpl` — three new top-level keys added alongside existing `effortLevel`
