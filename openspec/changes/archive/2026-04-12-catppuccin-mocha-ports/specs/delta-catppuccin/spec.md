## ADDED Requirements

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
