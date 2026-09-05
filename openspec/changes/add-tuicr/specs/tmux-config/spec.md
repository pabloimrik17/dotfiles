# Delta: tmux-config

## ADDED Requirements

### Requirement: Popup styling

The tmux configuration SHALL style overlay popups with rounded border lines (`popup-border-lines rounded`) and a Catppuccin Mocha accent border color (`popup-border-style`), so popups launched by any tool (gh-dash tuicr review, future bindings) match the stack theme. The accent color SHALL hold both with and without the catppuccin plugin installed: the plugin sets `popup-border-style` itself from a deferred `run -b`, which lands after the plain `set -g` lines, so the configuration SHALL also re-set it at the tail of that chain.

#### Scenario: Popup renders themed

- **WHEN** any `tmux display-popup` opens in a session using this configuration
- **THEN** the popup border uses rounded lines and the Catppuccin accent color

#### Scenario: Accent color survives the plugin load

- **WHEN** the catppuccin plugin is installed and its deferred load has completed
- **THEN** `popup-border-style` still reports the configured accent color, not the plugin's default
