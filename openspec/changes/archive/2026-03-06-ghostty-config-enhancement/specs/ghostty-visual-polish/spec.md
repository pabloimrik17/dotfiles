## ADDED Requirements

### Requirement: Window padding is visually balanced

The Ghostty config SHALL include `window-padding-balance = true` so that leftover pixel space (from viewport dimensions not evenly divisible by cell size) is distributed evenly across all four edges.

#### Scenario: Padding balance is active

- **WHEN** a user opens a Ghostty terminal window
- **THEN** the config contains `window-padding-balance = true` and extra pixel padding is distributed symmetrically rather than accumulating on the right/bottom edges

### Requirement: Window padding extends cell background color

The Ghostty config SHALL include `window-padding-color = extend` so that the padding area uses the background color of the nearest cell rather than the window background color. This eliminates visible seams between the terminal content and the window edges.

#### Scenario: Padding color extends from cells

- **WHEN** a terminal application (e.g., Neovim) sets a cell background color that differs from the window background
- **THEN** the padding area adjacent to those cells extends their background color, producing a seamless appearance

#### Scenario: Extend is disabled at prompt rows with powerline

- **WHEN** the nearest row contains powerline glyphs or is a shell prompt row
- **THEN** Ghostty's built-in heuristics disable extending for that edge (this is Ghostty's default behavior for `extend` mode, not something configured)

### Requirement: Font rendering is thickened on macOS

The Ghostty config SHALL include `font-thicken = true` to draw fonts with a thicker stroke on macOS Retina displays, improving legibility at the configured font size (14pt Hack Nerd Font).

#### Scenario: Font thickening is enabled

- **WHEN** a user opens a Ghostty terminal on macOS
- **THEN** the config contains `font-thicken = true` and text renders with thicker strokes compared to the default

### Requirement: Minimum contrast prevents invisible text

The Ghostty config SHALL include `minimum-contrast = 1.1` to ensure that foreground and background colors never have a contrast ratio below 1.1:1. This prevents text from being completely invisible (e.g., same color foreground and background) without distorting the catppuccin-mocha palette.

#### Scenario: Invisible text is prevented

- **WHEN** a terminal application sets foreground and background to the same or nearly identical colors
- **THEN** Ghostty adjusts the foreground color to maintain at least 1.1:1 contrast ratio

#### Scenario: Normal catppuccin colors are unaffected

- **WHEN** the terminal displays text using standard catppuccin-mocha palette colors
- **THEN** colors are NOT altered because catppuccin-mocha already exceeds 1.1:1 contrast for all standard color combinations
