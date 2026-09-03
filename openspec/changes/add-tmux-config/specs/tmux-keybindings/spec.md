## ADDED Requirements

### Requirement: Prefix key is Ctrl+A
`dot_tmux.conf` SHALL set the prefix key to `C-a` and unbind the default `C-b`. A `send-prefix` binding SHALL be configured so that pressing prefix twice sends a literal Ctrl+A to the underlying application.

#### Scenario: Prefix works
- **WHEN** user presses Ctrl+A followed by a tmux command key
- **THEN** tmux interprets it as a prefixed command

#### Scenario: Literal Ctrl+A passthrough
- **WHEN** user presses Ctrl+A twice
- **THEN** a literal Ctrl+A is sent to the active pane (for readline beginning-of-line)

### Requirement: Vi copy mode
`dot_tmux.conf` SHALL set `mode-keys` to `vi` so that copy mode uses vim-style navigation.

#### Scenario: Copy mode uses vi keys
- **WHEN** user enters copy mode
- **THEN** navigation uses h/j/k/l, visual selection uses v, and yank uses y

### Requirement: Status bar position
`dot_tmux.conf` SHALL set `status-position` to `top`.

#### Scenario: Status bar at top
- **WHEN** tmux starts
- **THEN** the status bar is displayed at the top of the terminal window

### Requirement: History limit
`dot_tmux.conf` SHALL set `history-limit` to 1000000 (1 million lines).

#### Scenario: Large scrollback available
- **WHEN** user scrolls back in a pane
- **THEN** up to 1 million lines of history are available
