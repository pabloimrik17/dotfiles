## MODIFIED Requirements

### Requirement: Both font families are installed via setup

The dotfiles setup SHALL install both `font-hack-nerd-font` and `font-jetbrains-mono-nerd-font` Homebrew casks so that either font choice is available without manual installation. Both fonts SHALL be under Homebrew's management, so that `brew outdated` reports them and `brew upgrade` advances them.

A pre-existing manual installation of either font SHALL NOT be treated as satisfying this requirement. Accepting a hand-copied font makes the setup report success while leaving the font permanently frozen at whatever version was copied — outside Homebrew's view, never upgraded, and never reported as outdated. The primary font renders every icon in this setup, so freezing it silently caps glyph coverage.

#### Scenario: Fresh machine setup installs both fonts

- **WHEN** a user runs the dotfiles setup script on a new machine
- **THEN** both Hack Nerd Font and JetBrainsMono Nerd Font are installed via Homebrew casks and available to Ghostty

#### Scenario: Switching to alternative font works without extra steps

- **WHEN** a user uncomments the alternative font config and comments out the primary
- **THEN** Ghostty reloads successfully with the alternative font because it is already installed

#### Scenario: Manual installation is surfaced, not silently accepted

- **WHEN** a font is present as a manual installation rather than a Homebrew cask
- **THEN** the setup SHALL report it as needing attention rather than counting it as installed

#### Scenario: Fonts are upgradable

- **WHEN** a newer version of either Nerd Font is released
- **THEN** `brew outdated` SHALL list the cask, and `brew upgrade` SHALL advance it
