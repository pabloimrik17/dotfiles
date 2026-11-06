## MODIFIED Requirements

### Requirement: I keybinding (tmux split pane)

The gh-dash config SHALL include an `I` keybinding in the prs section that opens ENHANCE in a tmux split pane with `ENHANCE_THEME=catppuccin_mocha` targeting the selected PR.

#### Scenario: User presses I on a PR in gh-dash

- **WHEN** the user presses `I` while a PR is selected in gh-dash
- **THEN** a tmux horizontal split pane opens running `ENHANCE_THEME=catppuccin_mocha gh enhance -R {{.RepoName}} {{.PrNumber}}`

### Requirement: i keybinding (inline)

The gh-dash config SHALL include an `i` keybinding in the prs section that opens ENHANCE inline with `ENHANCE_THEME=catppuccin_mocha` targeting the selected PR.

#### Scenario: User presses i on a PR in gh-dash

- **WHEN** the user presses `i` while a PR is selected in gh-dash
- **THEN** ENHANCE launches inline replacing gh-dash, and returns to gh-dash on exit

### Requirement: Theme consistency

Both keybindings and the `ghe` alias SHALL use `ENHANCE_THEME=catppuccin_mocha` (bubbletint theme ID) matching the global Catppuccin Mocha theme.

#### Scenario: ENHANCE theme matches dotfiles theme

- **WHEN** ENHANCE is launched via any method (alias, I, or i keybinding)
- **THEN** it renders with Catppuccin Mocha colors
