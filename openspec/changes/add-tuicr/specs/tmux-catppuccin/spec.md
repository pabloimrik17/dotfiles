# Delta: tmux-catppuccin

## MODIFIED Requirements

### Requirement: tmux uses Catppuccin plugin with Mocha flavor

The tmux configuration SHALL load the catppuccin/tmux plugin from `~/.config/tmux/plugins/catppuccin/tmux/catppuccin.tmux` with flavor set to `mocha` and window status style set to `rounded`. After the plugin runs, the same guarded `run` chain SHALL append `fill=##{@thm_overlay_0}` to `message-style` and `message-command-style` (via `tmux set -agF`): tmux ≥3.7 draws messages/prompts as a partial status-line overlay and only paints the full width when the style declares `fill`, which the pinned catppuccin v2.3.0 predates (no newer upstream release exists). The `##{…}` escaping SHALL be used so run-shell does not expand the format before the plugin defines `@thm_overlay_0`. At the tail of that same chain, after the message-style appends, the chain SHALL re-set `popup-border-style` to the Mocha mauve accent (`tmux set -g popup-border-style 'fg=#cba6f7'`): the plugin's own conf sets `popup-border-style` to its `surface_1` color as part of the deferred load, and this re-set restores the accent color owned by the `tmux-config` capability's Popup styling requirement.

#### Scenario: tmux session started

- **WHEN** user starts or attaches to a tmux session
- **THEN** the window list, status bar, and pane borders render with Catppuccin Mocha colors

#### Scenario: plugin not yet installed

- **WHEN** tmux starts and the plugin directory does not exist
- **THEN** tmux starts without errors (graceful degradation with default colors)

#### Scenario: command prompt paints the full bar (tmux ≥3.7)

- **WHEN** the user opens the command prompt (`prefix :`) or tmux displays a message under tmux 3.7+
- **THEN** the prompt/message line fills the entire status-line width with the Catppuccin overlay background instead of a partial overlay

#### Scenario: Popup border accent survives Catppuccin's own popup styling

- **WHEN** the catppuccin plugin loads via the deferred `run -b` chain and sets its own `popup-border-style`
- **THEN** the chain's tail re-set immediately overrides it back to the Mocha mauve accent (`fg=#cba6f7`) owned by the `tmux-config` capability's Popup styling requirement
