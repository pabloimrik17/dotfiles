# delta-catppuccin Specification

## Purpose

Configure git-delta to use the official Catppuccin Mocha theme for diffs and blame output via an included gitconfig.
## Requirements
### Requirement: delta uses official Catppuccin theme with diff blending

The gitconfig SHALL include the official `catppuccin.gitconfig` via `[include]` directive and activate the mocha flavor via `features = catppuccin-mocha` in the `[delta]` section. This provides:

- Diff blend colors: minus lines at 20%/35% red opacity, plus lines at 20%/35% green opacity
- Blame palette: 5 alternating Catppuccin base colors
- Hunk header decoration with Overlay0 box underline
- Line number styles (Overlay0 for zero lines, Red for minus, Green for plus)
- Map-styles for moved code (purple, blue, cyan, yellow mappings)
- `syntax-theme = Catppuccin Mocha` set internally (replaces BAT_THEME inheritance for delta)

#### Scenario: git diff with additions and deletions

- **WHEN** user runs `git diff` on a file with changes
- **THEN** added lines show green-tinted background (20% blend), removed lines show red-tinted background (20% blend), with emphasized changes at 35% blend

#### Scenario: git blame

- **WHEN** user runs `git blame`
- **THEN** blame columns alternate between 5 Catppuccin base colors (`#1e1e2e`, `#181825`, `#11111b`, `#313244`, `#45475a`)

### Requirement: delta catppuccin.gitconfig downloaded by install script

The install script SHALL download `catppuccin.gitconfig` from the official `catppuccin/delta` repo to `~/.config/delta/catppuccin.gitconfig`. The download SHALL be skipped if the file already exists.

#### Scenario: fresh install

- **WHEN** install script runs and `~/.config/delta/catppuccin.gitconfig` does not exist
- **THEN** the file is downloaded from `https://raw.githubusercontent.com/catppuccin/delta/main/catppuccin.gitconfig`

#### Scenario: already installed

- **WHEN** the file already exists
- **THEN** download is skipped with an info message

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

