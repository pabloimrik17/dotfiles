## Purpose

Installation of the CodeRabbit CLI (`coderabbit` / `cr`) via brew cask, with manual auth instruction for browser-based OAuth.

## Requirements

### Requirement: CodeRabbit CLI installed via brew cask

The install script SHALL include `coderabbit` in the `ALL_CASKS` array with category `AI` and description `AI code review CLI`.

#### Scenario: Fresh install on clean machine

- **WHEN** the user runs the install script and confirms GUI app installation
- **THEN** `coderabbit` SHALL be installed via `brew install --cask coderabbit`

#### Scenario: Already installed

- **WHEN** the user runs the install script and `/Applications/CodeRabbit.app` already exists
- **THEN** the installer SHALL skip coderabbit and report it as already installed

### Requirement: Manual auth instruction displayed

The install script SHALL print a manual instruction for `coderabbit auth login` in the manual instructions block.

#### Scenario: Install script completes

- **WHEN** the install script reaches the manual instructions section
- **THEN** it SHALL display a line indicating that `coderabbit auth login` must be run manually for authentication
