# tmux-config Delta

## ADDED Requirements

### Requirement: Mouse support

`dot_tmux.conf` SHALL include `set -g mouse on` so tmux handles click-to-select-pane, border drag-to-resize, and wheel-to-scrollback.

This setting is the single authority for mouse behavior in tmux sessions, including sessions created by AoE: the `agent-manager` capability requires AoE's `[tmux].mouse` to be `"auto"` precisely so that nothing overrides this line. Removing or disabling it therefore also disables the mouse inside aoe panes, with no second setting to fall back on.

Per the existing comment-style requirement, the setting SHALL carry an explanatory comment above it, and that comment SHALL note that AoE defers to this setting rather than applying its own.

#### Scenario: Setting present in config

- **WHEN** `dot_tmux.conf` is applied via chezmoi
- **THEN** tmux resolves the global `mouse` option to `on`

#### Scenario: Comment records the AoE relationship

- **WHEN** reading `dot_tmux.conf`
- **THEN** `set -g mouse on` has a comment above it describing what the mouse controls and noting that AoE sessions inherit this setting rather than setting their own
