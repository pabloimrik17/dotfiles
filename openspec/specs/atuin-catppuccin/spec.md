# atuin-catppuccin Specification

## Purpose

Configure atuin shell history to use the official Catppuccin Mocha blue theme for search UI rendering.

## Requirements

### Requirement: atuin uses Catppuccin Mocha blue theme

The atuin config at `dot_config/atuin/config.toml` SHALL reference the Catppuccin Mocha blue theme via:

```toml
[theme]
name = "catppuccin-mocha-blue"
```

The theme file SHALL be downloaded to `~/.config/atuin/themes/catppuccin-mocha-blue.toml` by the install script.

#### Scenario: atuin search UI

- **WHEN** user triggers atuin history search (Ctrl+R)
- **THEN** the search UI renders with Catppuccin Mocha colors (blue titles/annotations, green alerts, red errors, subtext0 guidance)

#### Scenario: theme file missing

- **WHEN** the theme file does not exist at `~/.config/atuin/themes/catppuccin-mocha-blue.toml`
- **THEN** atuin falls back to default colors without errors

### Requirement: atuin theme downloaded by install script

The install script SHALL download the theme file from the official `catppuccin/atuin` repo to `~/.config/atuin/themes/catppuccin-mocha-blue.toml`. The download SHALL be skipped if the file already exists.

#### Scenario: fresh install

- **WHEN** install script runs and the theme file does not exist
- **THEN** the file is downloaded from `https://raw.githubusercontent.com/catppuccin/atuin/main/themes/mocha/catppuccin-mocha-blue.toml`

#### Scenario: already installed

- **WHEN** the file already exists
- **THEN** download is skipped with an info message
