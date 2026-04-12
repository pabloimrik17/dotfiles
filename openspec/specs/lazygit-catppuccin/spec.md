# lazygit-catppuccin Specification

## Purpose

Configure lazygit to use the official Catppuccin Mocha blue theme via a chezmoi-managed config file.

## Requirements

### Requirement: lazygit renders with Catppuccin Mocha blue theme

A chezmoi-managed config file SHALL exist at `dot_config/lazygit/config.yml` deploying to `~/.config/lazygit/config.yml` (macOS: `~/Library/Application Support/lazygit/config.yml` is also valid, but `~/.config/lazygit/` is the XDG standard path). The file SHALL contain the official Catppuccin Mocha blue theme under `gui`:

**`gui.theme`:**

- `activeBorderColor`: `#89b4fa` bold (Blue)
- `inactiveBorderColor`: `#a6adc8` (Subtext0)
- `searchingActiveBorderColor`: `#f9e2af` (Yellow)
- `optionsTextColor`: `#89b4fa` (Blue)
- `selectedLineBgColor`: `#313244` (Surface0)
- `inactiveViewSelectedLineBgColor`: `#6c7086` (Overlay0)
- `cherryPickedCommitFgColor`: `#89b4fa` (Blue)
- `cherryPickedCommitBgColor`: `#45475a` (Surface1)
- `markedBaseCommitFgColor`: `#89b4fa` (Blue)
- `markedBaseCommitBgColor`: `#f9e2af` (Yellow)
- `unstagedChangesColor`: `#f38ba8` (Red)
- `defaultFgColor`: `#cdd6f4` (Text)

**`gui.authorColors`:**

- `*`: `#b4befe` (Lavender)

#### Scenario: lazygit launched

- **WHEN** user runs `lazygit`
- **THEN** all borders, selections, text, and highlights render with Catppuccin Mocha blue accent colors

#### Scenario: config file deployed by chezmoi

- **WHEN** `chezmoi apply` is run
- **THEN** `~/.config/lazygit/config.yml` is created/updated with the theme configuration
