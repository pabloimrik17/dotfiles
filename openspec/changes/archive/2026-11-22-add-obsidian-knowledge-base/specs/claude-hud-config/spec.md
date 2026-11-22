# Spec Delta

## ADDED Requirements

### Requirement: Config counts are hidden

The claude-hud config SHALL NOT set `display.showConfigCounts` or `display.environmentThreshold`. The plugin default (`showConfigCounts: false`) hides the config-counts segment.

The old `environmentThreshold: 200` never worked: claude-hud clamps it to 0–100, and the segment stayed hidden until CLAUDE.md, rules, MCPs and hooks reached the threshold.

#### Scenario: Counts hidden in the deployed file

- **WHEN** `chezmoi apply` deploys `~/.claude/plugins/claude-hud/config.json`
- **THEN** the file has no `showConfigCounts` and no `environmentThreshold` key

### Requirement: The config lists only customised keys

The claude-hud config SHALL hold only keys whose value differs from the claude-hud 0.15.4 default: `lineLayout` `compact`, `showSeparators` `true`, `pathLevels` `2`, `gitStatus.showAheadBehind` and `gitStatus.showFileStats` `true`, `display.showTools`, `showAgents`, `showTodos` and `showDuration` `true`, `display.usageThreshold` `60`, `display.sevenDayThreshold` `70`.

#### Scenario: Only customised keys present

- **WHEN** the source `private_config.json` is read
- **THEN** its keys are exactly the list above, with those values

### Requirement: The config is deployed like claude-hud writes it

The source SHALL be `dot_claude/plugins/claude-hud/private_config.json`: 2-space JSON, deployed with mode 0600, as `hud set` writes it. `.oxfmtignore` SHALL list the source, so lint-staged's oxfmt does not reformat it.

#### Scenario: Deployed mode is 0600

- **WHEN** `chezmoi apply` deploys `~/.claude/plugins/claude-hud/config.json`
- **THEN** its mode is 0600

#### Scenario: Ignored by oxfmt

- **WHEN** `.oxfmtignore` is read
- **THEN** it lists `dot_claude/plugins/claude-hud/private_config.json`
