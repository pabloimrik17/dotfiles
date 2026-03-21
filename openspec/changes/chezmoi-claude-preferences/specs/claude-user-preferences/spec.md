## ADDED Requirements

### Requirement: Extended thinking is always enabled

The chezmoi template SHALL include `"alwaysThinkingEnabled": true` as a top-level key in `dot_claude/settings.json.tmpl`.

#### Scenario: Template includes alwaysThinkingEnabled

- **WHEN** chezmoi applies `dot_claude/settings.json.tmpl`
- **THEN** `~/.claude/settings.json` SHALL contain `"alwaysThinkingEnabled": true`

### Requirement: Voice mode is enabled

The chezmoi template SHALL include `"voiceEnabled": true` as a top-level key in `dot_claude/settings.json.tmpl`.

#### Scenario: Template includes voiceEnabled

- **WHEN** chezmoi applies `dot_claude/settings.json.tmpl`
- **THEN** `~/.claude/settings.json` SHALL contain `"voiceEnabled": true`

### Requirement: Dangerous mode permission prompt is skipped

The chezmoi template SHALL include `"skipDangerousModePermissionPrompt": true` as a top-level key in `dot_claude/settings.json.tmpl`.

#### Scenario: Template includes skipDangerousModePermissionPrompt

- **WHEN** chezmoi applies `dot_claude/settings.json.tmpl`
- **THEN** `~/.claude/settings.json` SHALL contain `"skipDangerousModePermissionPrompt": true`
