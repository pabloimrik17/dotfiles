# tmux-catppuccin Specification

## Purpose

Configure tmux to use the official Catppuccin plugin with Mocha flavor for status bar and pane border styling.

## Requirements

### Requirement: tmux uses Catppuccin plugin with Mocha flavor

The tmux configuration SHALL load the catppuccin/tmux plugin from `~/.config/tmux/plugins/catppuccin/tmux/catppuccin.tmux` with flavor set to `mocha` and window status style set to `rounded`.

#### Scenario: tmux session started

- **WHEN** user starts or attaches to a tmux session
- **THEN** the window list, status bar, and pane borders render with Catppuccin Mocha colors

#### Scenario: plugin not yet installed

- **WHEN** tmux starts and the plugin directory does not exist
- **THEN** tmux starts without errors (graceful degradation with default colors)

### Requirement: tmux status line shows application and session

The status line SHALL display two modules on the right side:

- `@catppuccin_status_application`: shows the running application name
- `@catppuccin_status_session`: shows the tmux session name

The left side SHALL be empty. Status right length SHALL be 100.

#### Scenario: status bar content

- **WHEN** user is in a tmux session running vim
- **THEN** the right status bar shows the application name ("vim") and the session name, styled with Catppuccin Mocha colors and rounded separators

### Requirement: tmux plugin installed by install script

The install script SHALL clone `catppuccin/tmux` at tag `v2.3.0` to `~/.config/tmux/plugins/catppuccin/tmux/` using a shallow clone (`--depth 1`). The clone SHALL be skipped if the directory already exists.

#### Scenario: fresh install

- **WHEN** install script runs and `~/.config/tmux/plugins/catppuccin/tmux/` does not exist
- **THEN** the repo is cloned at the pinned tag with depth 1

#### Scenario: already installed

- **WHEN** install script runs and the directory already exists
- **THEN** the clone is skipped with an info message
