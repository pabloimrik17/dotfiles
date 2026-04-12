# zsh-syntax-catppuccin Specification

## Purpose

Configure zsh-syntax-highlighting to use the official Catppuccin Mocha theme for shell syntax coloring.

## Requirements

### Requirement: zsh-syntax-highlighting uses Catppuccin Mocha theme

The official Catppuccin Mocha theme file SHALL be sourced in `.zshrc` before the zsh-syntax-highlighting plugin loads. The source line SHALL use a guard (`[[ -f ... ]] && source`) for graceful degradation.

The theme colors commands green, options peach, strings green, paths sapphire, comments surface2, errors red, and other syntax elements according to the official Catppuccin Mocha palette.

#### Scenario: typing a valid command

- **WHEN** user types a recognized command (e.g., `git`)
- **THEN** the command text is highlighted in green (`#a6e3a1`)

#### Scenario: typing an invalid command

- **WHEN** user types an unrecognized command
- **THEN** the command text is highlighted in red (`#f38ba8`)

#### Scenario: theme file missing

- **WHEN** the theme file at `~/.zsh/catppuccin_mocha-zsh-syntax-highlighting.zsh` does not exist
- **THEN** zsh-syntax-highlighting loads with default colors, no error is shown

### Requirement: zsh-syntax-highlighting theme downloaded by install script

The install script SHALL download the theme from the official `catppuccin/zsh-syntax-highlighting` repo to `~/.zsh/catppuccin_mocha-zsh-syntax-highlighting.zsh`. The download SHALL be skipped if the file already exists.

#### Scenario: fresh install

- **WHEN** install script runs and the file does not exist
- **THEN** the file is downloaded from `https://raw.githubusercontent.com/catppuccin/zsh-syntax-highlighting/main/themes/catppuccin_mocha-zsh-syntax-highlighting.zsh`

#### Scenario: already installed

- **WHEN** the file already exists
- **THEN** download is skipped with an info message
