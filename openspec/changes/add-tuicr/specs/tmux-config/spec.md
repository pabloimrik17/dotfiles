# Delta: tmux-config

## ADDED Requirements

### Requirement: Popup styling

The tmux configuration SHALL style overlay popups with rounded border lines (`popup-border-lines rounded`) and a Catppuccin Mocha accent border color (`popup-border-style`), so popups launched by any tool (gh-dash tuicr review, future bindings) match the stack theme.

#### Scenario: Popup renders themed

- **WHEN** any `tmux display-popup` opens in a session using this configuration
- **THEN** the popup border uses rounded lines and the Catppuccin accent color
