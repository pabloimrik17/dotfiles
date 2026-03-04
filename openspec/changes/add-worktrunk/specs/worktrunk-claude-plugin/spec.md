## ADDED Requirements

### Requirement: Enable worktrunk Claude Code plugin
The Claude Code settings template SHALL include `worktrunk@worktrunk` in the `enabledPlugins` object set to `true`.

#### Scenario: Settings applied
- **WHEN** chezmoi applies `dot_claude/settings.json.tmpl`
- **THEN** the resulting `~/.claude/settings.json` SHALL contain `"worktrunk@worktrunk": true` in `enabledPlugins`

#### Scenario: Plugin functional after apply
- **WHEN** Claude Code starts in a git repository with worktrunk installed
- **THEN** the worktrunk plugin SHALL provide configuration skills and activity tracking capabilities
