# tmux-catppuccin Specification

## Purpose

Configure tmux to use the official Catppuccin plugin with Mocha flavor for status bar and pane border styling.
## Requirements
### Requirement: tmux uses Catppuccin plugin with Mocha flavor

The tmux configuration SHALL load the catppuccin/tmux plugin from `~/.config/tmux/plugins/catppuccin/tmux/catppuccin.tmux` with flavor set to `mocha` and window status style set to `rounded`. After the plugin runs, the same guarded `run` chain SHALL append `fill=##{@thm_overlay_0}` to `message-style` and `message-command-style` (via `tmux set -agF`): tmux ≥3.7 draws messages/prompts as a partial status-line overlay and only paints the full width when the style declares `fill`, which the pinned catppuccin v2.3.0 predates (no newer upstream release exists). The `##{…}` escaping SHALL be used so run-shell does not expand the format before the plugin defines `@thm_overlay_0`.

#### Scenario: tmux session started

- **WHEN** user starts or attaches to a tmux session
- **THEN** the window list, status bar, and pane borders render with Catppuccin Mocha colors

#### Scenario: plugin not yet installed

- **WHEN** tmux starts and the plugin directory does not exist
- **THEN** tmux starts without errors (graceful degradation with default colors)

#### Scenario: command prompt paints the full bar (tmux ≥3.7)

- **WHEN** the user opens the command prompt (`prefix :`) or tmux displays a message under tmux 3.7+
- **THEN** the prompt/message line fills the entire status-line width with the Catppuccin overlay background instead of a partial overlay

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

