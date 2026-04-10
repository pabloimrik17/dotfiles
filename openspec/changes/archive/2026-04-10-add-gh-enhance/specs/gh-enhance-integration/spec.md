## ADDED Requirements

### Requirement: T keybinding (tmux split pane)

The gh-dash config SHALL include a `T` keybinding in the prs section that opens ENHANCE in a tmux split pane with `ENHANCE_THEME=catppuccin_mocha` targeting the selected PR.

#### Scenario: User presses T on a PR in gh-dash

- **WHEN** the user presses `T` while a PR is selected in gh-dash
- **THEN** a tmux horizontal split pane opens running `ENHANCE_THEME=catppuccin_mocha gh enhance -R {{.RepoName}} {{.PrNumber}}`

### Requirement: t keybinding (inline)

The gh-dash config SHALL include a `t` keybinding in the prs section that opens ENHANCE inline with `ENHANCE_THEME=catppuccin_mocha` targeting the selected PR.

#### Scenario: User presses t on a PR in gh-dash

- **WHEN** the user presses `t` while a PR is selected in gh-dash
- **THEN** ENHANCE launches inline replacing gh-dash, and returns to gh-dash on exit

### Requirement: Theme consistency

Both keybindings and the `ghe` alias SHALL use `ENHANCE_THEME=catppuccin_mocha` (bubbletint theme ID) matching the global Catppuccin Mocha theme.

#### Scenario: ENHANCE theme matches dotfiles theme

- **WHEN** ENHANCE is launched via any method (alias, T, or t keybinding)
- **THEN** it renders with Catppuccin Mocha colors
