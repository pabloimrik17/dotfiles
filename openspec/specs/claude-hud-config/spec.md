# Capability: claude-hud-config

## Purpose

Claude HUD statusline plugin configuration managed by chezmoi — display thresholds and git status options.

## Requirements

### Requirement: Git ahead/behind is enabled

The claude-hud config SHALL set `gitStatus.showAheadBehind` to `true`.

#### Scenario: Commits ahead of remote are visible

- **WHEN** the current branch has 2 commits not pushed to remote
- **THEN** the statusline SHALL display `^2` after the branch name

#### Scenario: Commits behind remote are visible

- **WHEN** the remote has 1 commit not pulled locally
- **THEN** the statusline SHALL display `v1` after the branch name

### Requirement: Git file stats is enabled

The claude-hud config SHALL set `gitStatus.showFileStats` to `true`.

#### Scenario: Modified and untracked files are visible

- **WHEN** the working tree has 3 modified files and 2 untracked files
- **THEN** the statusline SHALL display `!3 ?2` in the git section

### Requirement: Usage threshold is lowered to 60%

The claude-hud config SHALL set `display.usageThreshold` to `60`.

#### Scenario: Usage visible at 65%

- **WHEN** the 5h rate limit usage is at 65%
- **THEN** the statusline SHALL display the 5h usage bar and percentage

#### Scenario: Usage visible at exactly 60%

- **WHEN** the 5h or 7d rate limit usage is exactly 60%
- **THEN** the statusline SHALL display the usage block

#### Scenario: Usage hidden at 55%

- **WHEN** both 5h and 7d rate limit usage are below 60%
- **THEN** the statusline SHALL NOT display any usage information

### Requirement: Seven-day usage threshold is set to 70%

The claude-hud config SHALL set `display.sevenDayThreshold` to `70`.

#### Scenario: Weekly usage visible at 75%

- **WHEN** the 7d rate limit usage is at 75%
- **AND** the usage block is visible (max of 5h/7d >= 60%)
- **THEN** the statusline SHALL display both 5h and 7d usage

#### Scenario: Weekly usage visible at exactly 70%

- **WHEN** the 7d rate limit usage is exactly 70%
- **AND** the usage block is visible (max of 5h/7d >= 60%)
- **THEN** the statusline SHALL display the 7d usage line

#### Scenario: Weekly usage hidden at 65%

- **WHEN** the 7d rate limit usage is at 65%
- **THEN** the statusline SHALL NOT display the 7d usage line

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
