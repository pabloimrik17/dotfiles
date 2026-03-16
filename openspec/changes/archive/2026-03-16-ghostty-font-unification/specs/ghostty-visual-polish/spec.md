## MODIFIED Requirements

### Requirement: Font rendering is thickened on macOS

The Ghostty config SHALL include `font-thicken = true` to draw fonts with a thicker stroke on macOS Retina displays, improving legibility at the configured font size (14pt Hack Nerd Font). The config SHALL also include a commented alternative font configuration (JetBrainsMono Nerd Font @ 14, thicken ON) directly below the active font settings for quick switching.

#### Scenario: Font thickening is enabled

- **WHEN** a user opens a Ghostty terminal on macOS
- **THEN** the config contains `font-thicken = true` and text renders with thicker strokes compared to the default

#### Scenario: Commented alternative font is present

- **WHEN** a user inspects the font section of the Ghostty config
- **THEN** commented lines for `font-family = "JetBrainsMono Nerd Font"` with `font-size = 14` and `font-thicken = true` SHALL be present directly below the active font configuration

## ADDED Requirements

### Requirement: Both font families are installed via setup

The dotfiles setup SHALL install both `font-hack-nerd-font` and `font-jetbrains-mono-nerd-font` Homebrew casks so that either font choice is available without manual installation.

#### Scenario: Fresh machine setup installs both fonts

- **WHEN** a user runs the dotfiles setup script on a new machine
- **THEN** both Hack Nerd Font and JetBrainsMono Nerd Font are installed and available to Ghostty

#### Scenario: Switching to alternative font works without extra steps

- **WHEN** a user uncomments the alternative font config and comments out the primary
- **THEN** Ghostty reloads successfully with the alternative font because it is already installed
