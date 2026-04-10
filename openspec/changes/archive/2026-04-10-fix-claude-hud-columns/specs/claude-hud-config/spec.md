## ADDED Requirements

### Requirement: Statusline command sets COLUMNS for subprocess mode

The chezmoi template for `statusLine.command` in `dot_claude/settings.json.tmpl` SHALL prefix the bun invocation with `COLUMNS=200` to prevent line wrapping when the plugin runs as a subprocess without terminal width information.

#### Scenario: COLUMNS is present in the rendered command

- **WHEN** `chezmoi cat ~/.claude/settings.json` is executed
- **THEN** the `statusLine.command` value SHALL contain `COLUMNS=200` before the bun binary path

#### Scenario: Statusline does not wrap after chezmoi apply

- **WHEN** `chezmoi apply` is run on a machine with the claude-hud plugin installed
- **AND** the statusline command is invoked by Claude Code
- **THEN** the output SHALL render on a single line without wrapping

#### Scenario: Fix is removed after upstream resolution

- **WHEN** jarrodwatts/claude-hud#404 is resolved and the plugin handles missing terminal width gracefully
- **THEN** the `COLUMNS=200` prefix MAY be removed from the template without functional impact
