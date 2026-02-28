## ADDED Requirements

### Requirement: Ghostty config is managed as source state

The repo SHALL include `dot_config/ghostty/config` containing the full Ghostty configuration (theme, font, window, cursor, shell integration, keybindings).

#### Scenario: Apply sets Ghostty config

- **WHEN** chezmoi apply runs on a machine without Ghostty config
- **THEN** `~/.config/ghostty/config` is created with the managed configuration

#### Scenario: Diff shows Ghostty config changes

- **WHEN** user modifies `~/.config/ghostty/config` locally and runs `chezmoi diff`
- **THEN** the diff shows the divergence between source state and local file

### Requirement: Catppuccin themes are bundled

The repo SHALL include all 4 catppuccin theme variants (frappe, latte, macchiato, mocha) under `dot_config/ghostty/themes/`.

#### Scenario: Themes available after apply

- **WHEN** chezmoi apply completes
- **THEN** `~/.config/ghostty/themes/` contains catppuccin-frappe, catppuccin-latte, catppuccin-macchiato, catppuccin-mocha

#### Scenario: Theme referenced in config exists

- **WHEN** Ghostty config references `theme = catppuccin-mocha`
- **THEN** the corresponding theme file exists at `~/.config/ghostty/themes/catppuccin-mocha`

### Requirement: Ghostty config is static (not templated)

The Ghostty config SHALL be a plain file (not `.tmpl`) since it contains no machine-specific paths or variables. This keeps it directly editable and diffable.

#### Scenario: Config has no template directives

- **WHEN** a user inspects `dot_config/ghostty/config` in the repo
- **THEN** the file contains no Go template syntax (`{{ }}`)
