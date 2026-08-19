## MODIFIED Requirements

### Requirement: Enable worktrunk Claude Code plugin

The Claude Code settings SHALL include `worktrunk@worktrunk` in the `enabledPlugins` object set to `true`.

#### Scenario: Settings applied

- **WHEN** chezmoi applies `dot_claude/modify_settings.json.tmpl`
- **THEN** the resulting `~/.claude/settings.json` SHALL contain `"worktrunk@worktrunk": true` in `enabledPlugins`

#### Scenario: Plugin loads without errors

- **WHEN** Claude Code starts with worktrunk installed
- **THEN** the worktrunk plugin SHALL load without startup errors
