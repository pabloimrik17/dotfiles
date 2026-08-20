## ADDED Requirements

### Requirement: A standalone delta config serves lazygit's diff renderer

The dotfiles SHALL provide a chezmoi-managed, self-contained delta configuration file suitable for passing to delta as an explicit config, and lazygit SHALL be configured to render diffs through delta using it.

lazygit does not inherit the user's git pager. Pointing it at delta with the user's normal gitconfig is not viable — the flag that isolates delta from the ambient gitconfig also discards the Catppuccin theme. A small standalone file that includes the existing Catppuccin delta config and selects the feature gives lazygit the themed renderer without disturbing the terminal `git diff` path.

The renderer SHALL be declared under lazygit's current key name. Writing the superseded key name triggers lazygit's config migration, which rewrites the whole chezmoi-managed file — the drift hazard this repo already guards against elsewhere.

#### Scenario: lazygit renders diffs through delta

- **WHEN** the user opens a diff in lazygit
- **THEN** it SHALL be rendered by delta with the Catppuccin Mocha theme and 24-bit colour

#### Scenario: Terminal git diff is unaffected

- **WHEN** the user runs `git diff` in a terminal
- **THEN** its output SHALL be unchanged by the presence of the lazygit-specific delta config

#### Scenario: No config migration is triggered

- **WHEN** lazygit starts with the managed config
- **AND** `chezmoi status` is run afterwards
- **THEN** the lazygit config file SHALL be unmodified

#### Scenario: Single renderer means no cycling affordance

- **WHEN** exactly one diff renderer is configured
- **THEN** lazygit SHALL NOT bind a renderer-cycling key, and no keybinding entry is required in the managed config
