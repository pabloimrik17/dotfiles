## ADDED Requirements

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

#### Scenario: Usage hidden at 55%

- **WHEN** both 5h and 7d rate limit usage are below 60%
- **THEN** the statusline SHALL NOT display any usage information

### Requirement: Seven-day usage threshold is set to 70%

The claude-hud config SHALL set `display.sevenDayThreshold` to `70`.

#### Scenario: Weekly usage visible at 75%

- **WHEN** the 7d rate limit usage is at 75%
- **AND** the usage block is visible (max of 5h/7d >= 60%)
- **THEN** the statusline SHALL display both 5h and 7d usage

#### Scenario: Weekly usage hidden at 65%

- **WHEN** the 7d rate limit usage is at 65%
- **THEN** the statusline SHALL NOT display the 7d usage line
