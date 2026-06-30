## ADDED Requirements

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
