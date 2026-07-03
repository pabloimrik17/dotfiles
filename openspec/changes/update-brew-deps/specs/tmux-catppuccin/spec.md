# tmux-catppuccin Delta

## MODIFIED Requirements

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
