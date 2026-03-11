## ADDED Requirements

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
