## ADDED Requirements

### Requirement: BAT_THEME environment variable
The `dot_zshrc.tmpl` SHALL export `BAT_THEME="Catppuccin Mocha"`. This sets the syntax highlighting theme for both `bat` and `delta` (which inherits bat's syntax engine).

#### Scenario: bat uses catppuccin theme
- **WHEN** the user runs `bat` on any file
- **THEN** syntax highlighting uses the Catppuccin Mocha color scheme

#### Scenario: delta inherits bat theme
- **WHEN** the user runs `git diff` (with delta as pager)
- **THEN** syntax highlighting uses the Catppuccin Mocha color scheme via BAT_THEME inheritance

#### Scenario: Theme name is exact
- **WHEN** inspecting the BAT_THEME export line
- **THEN** the value is exactly `Catppuccin Mocha` (case-sensitive, space-separated — matching bat's built-in theme name)
