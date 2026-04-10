# gh-enhance-install Specification

## Purpose

TBD - created by archiving change add-gh-enhance. Update Purpose after archive.

## Requirements

### Requirement: gh-enhance extension install

The chezmoi install script SHALL install `gh-enhance` in the existing gh CLI extensions confirmable group using `gh extension install dlvhdr/gh-enhance`.

#### Scenario: Fresh install of gh-enhance

- **WHEN** chezmoi apply runs and the user confirms the gh extensions group
- **THEN** `gh-enhance` is installed via `gh extension install dlvhdr/gh-enhance`

#### Scenario: gh-enhance already installed

- **WHEN** chezmoi apply runs and gh-enhance is already listed in `gh extension list`
- **THEN** the script skips installation and reports it as already installed

### Requirement: Shell alias

The zshrc SHALL define alias `ghe` that sets `ENHANCE_THEME=catppuccin_mocha` and invokes `gh enhance`, placed in the GitHub aliases section.

#### Scenario: User launches gh-enhance via alias

- **WHEN** the user types `ghe 767` in the terminal
- **THEN** `ENHANCE_THEME=catppuccin_mocha gh enhance 767` is executed, opening ENHANCE with Catppuccin Mocha theme
