## ADDED Requirements

### Requirement: Claude Code loads CLAUDE.md and AGENTS.md together

The managed key set SHALL include `pluginConfigs."cc-plugin-agents-md@builtin".options.instructionFiles` set to `"claude-md-and-agents-md"` in `dot_claude/modify_settings.json.tmpl`. Claude Code honours this key only in user settings, a `--settings` file or managed settings, so it MUST live in the user-scope source. The `cc-plugin-agents-md@builtin` ID is read only from Claude Code v2.1.285; earlier builds used `agents-md@builtin` and ignore an entry under the new ID. The merge SHALL descend through `pluginConfigs`, the plugin entry and `options`, so other plugin entries and other options survive.

#### Scenario: Fresh settings select both files

- **WHEN** `~/.claude/settings.json` lacks `pluginConfigs` and chezmoi applies the managed settings
- **THEN** it SHALL contain `"instructionFiles": "claude-md-and-agents-md"` under `pluginConfigs."cc-plugin-agents-md@builtin".options`

#### Scenario: The default mode is overwritten

- **WHEN** the live value is `"claude-md-or-agents-md"` and chezmoi applies the managed settings
- **THEN** it SHALL become `"claude-md-and-agents-md"`

#### Scenario: Unrelated plugin configuration survives

- **WHEN** the live file holds other `pluginConfigs` entries or other options under this plugin
- **THEN** they SHALL retain their values after the merge

#### Scenario: Repeated merge converges

- **WHEN** the merged output is processed again
- **THEN** the second output SHALL be byte-identical to the first
