# Capability: tmux-config

## Purpose

Configure tmux settings in `dot_tmux.conf` for terminal multiplexer behavior, event handling, and integration with tools running inside tmux sessions.
## Requirements
### Requirement: Focus event passthrough

`dot_tmux.conf` SHALL include `set -g focus-events on` so tmux forwards focus/unfocus events to applications running inside it.

#### Scenario: Setting present in config

- **WHEN** `dot_tmux.conf` is applied via chezmoi
- **THEN** tmux has `focus-events` set to `on`

#### Scenario: Vim autoread works

- **WHEN** a file is modified outside vim while vim is running inside tmux
- **AND** the user switches focus back to the tmux pane
- **THEN** vim receives the focus event (enabling features like `autoread` if configured)

### Requirement: Descriptive comment

Each setting in `dot_tmux.conf` SHALL have a comment line above it explaining its purpose, matching the existing comment style.

#### Scenario: Focus events comment

- **WHEN** reading `dot_tmux.conf`
- **THEN** `set -g focus-events on` has a comment above it describing its purpose (focus event forwarding for vim autoread and shell integration)

### Requirement: Graphics protocol passthrough

`dot_tmux.conf` SHALL include `set -g allow-passthrough on` so terminal graphics escape sequences
(the Kitty graphics protocol used by `mdfried`, and similar) pass through tmux to the application
running inside a pane. Without it, image/`mermaid`/Big-Header rendering inside tmux is intercepted
and degrades to character rendering. Per the existing comment-style requirement, the setting SHALL
carry an explanatory comment above it.

#### Scenario: Setting present in config

- **WHEN** `dot_tmux.conf` is applied via chezmoi
- **THEN** tmux has `allow-passthrough` set to `on`

#### Scenario: mdfried graphics survive inside tmux

- **WHEN** `mdfried` renders an embedded image or `mermaid` diagram in a pane inside tmux running under a graphics-capable terminal
- **THEN** the graphics are drawn rather than being stripped by tmux

#### Scenario: Passthrough setting comment

- **WHEN** reading `dot_tmux.conf`
- **THEN** `set -g allow-passthrough on` has a comment above it describing its purpose (let terminal graphics protocols reach applications inside tmux)

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

### Requirement: Popup styling

The tmux configuration SHALL style overlay popups with rounded border lines (`popup-border-lines rounded`) and a Catppuccin Mocha accent border color (`popup-border-style`), so popups launched by any tool (gh-dash tuicr review, future bindings) match the stack theme. The accent color SHALL hold both with and without the catppuccin plugin installed: the plugin sets `popup-border-style` itself from a deferred `run -b`, which lands after the plain `set -g` lines, so the configuration SHALL also re-set it at the tail of that chain. That chain is the one defined by the `tmux-catppuccin` capability's "tmux uses Catppuccin plugin with Mocha flavor" requirement; if that chain changes, the popup-border-style re-set at its tail SHALL be preserved.

#### Scenario: Popup renders themed

- **WHEN** any `tmux display-popup` opens in a session using this configuration
- **THEN** the popup border uses rounded lines and the Catppuccin accent color

#### Scenario: Accent color survives the plugin load

- **WHEN** the catppuccin plugin is installed and its deferred load has completed
- **THEN** `popup-border-style` still reports the configured accent color, not the plugin's default
