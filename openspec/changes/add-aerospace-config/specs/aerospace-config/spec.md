## ADDED Requirements

### Requirement: AeroSpace installation
The install script SHALL include `aerospace` in the brew casks group.

#### Scenario: Fresh install includes AeroSpace
- **WHEN** user runs the install script and confirms the brew casks group
- **THEN** AeroSpace is installed via `brew install --cask aerospace`

### Requirement: Configuration file managed by Chezmoi
An AeroSpace config file SHALL exist at `dot_config/aerospace/aerospace.toml` managed by Chezmoi.

#### Scenario: Config applied by chezmoi
- **WHEN** `chezmoi apply` runs
- **THEN** `~/.config/aerospace/aerospace.toml` exists with the complete tiling configuration

### Requirement: Window navigation with alt+HJKL
The config SHALL bind `alt+h`, `alt+j`, `alt+k`, `alt+l` to focus the window in the left, down, up, right direction respectively.

#### Scenario: Navigate to window on the left
- **WHEN** user presses alt+H with multiple tiled windows
- **THEN** focus moves to the window on the left

#### Scenario: Navigate to window below
- **WHEN** user presses alt+J with vertically stacked windows
- **THEN** focus moves to the window below

### Requirement: Window movement with alt+shift+HJKL
The config SHALL bind `alt+shift+h`, `alt+shift+j`, `alt+shift+k`, `alt+shift+l` to move the focused window in the respective direction.

#### Scenario: Move window left
- **WHEN** user presses alt+shift+H
- **THEN** the focused window swaps position with the window to its left

### Requirement: Workspace switching with alt+number
The config SHALL bind `alt+1` through `alt+7` to switch to workspaces 1-7.

#### Scenario: Switch to workspace 3
- **WHEN** user presses alt+3
- **THEN** workspace 3 is shown immediately (no macOS animation)

### Requirement: Move window to workspace with alt+shift+number
The config SHALL bind `alt+shift+1` through `alt+shift+7` to move the focused window to the respective workspace.

#### Scenario: Move window to workspace 2
- **WHEN** user presses alt+shift+2
- **THEN** the focused window moves to workspace 2

### Requirement: Fullscreen and floating toggles
The config SHALL bind `alt+m` to toggle fullscreen and `alt+f` to toggle floating for the focused window.

#### Scenario: Toggle fullscreen
- **WHEN** user presses alt+M on a tiled window
- **THEN** the window enters fullscreen mode, covering the workspace

#### Scenario: Toggle floating
- **WHEN** user presses alt+F on a tiled window
- **THEN** the window becomes floating and can be moved/resized freely

### Requirement: Auto-assign apps to workspaces
The config SHALL include `on-window-detected` rules that automatically move specific apps to designated workspaces by bundle ID.

#### Scenario: Slack opens in communication workspace
- **WHEN** Slack window is detected
- **THEN** it is automatically moved to the communication workspace

#### Scenario: Ghostty opens in terminal workspace
- **WHEN** Ghostty window is detected
- **THEN** it is automatically moved to the terminal workspace

### Requirement: Floating app exceptions
The config SHALL configure specific apps as always-floating: Finder, Calculator, System Settings, 1Password, Archive Utility.

#### Scenario: Finder opens floating
- **WHEN** a Finder window opens
- **THEN** it appears as a floating window, not tiled

### Requirement: Workspace-to-monitor assignments
The config SHALL include `workspace-to-monitor-force-assignment` mapping workspace groups to specific monitors.

#### Scenario: Workspace follows monitor
- **WHEN** the user switches to a workspace assigned to a specific monitor
- **THEN** that monitor activates and shows the workspace

### Requirement: Conservative gaps
The config SHALL set inner and outer gaps to 8 pixels.

#### Scenario: Gaps between windows
- **WHEN** multiple windows are tiled
- **THEN** there is an 8px gap between adjacent windows and between windows and screen edges
