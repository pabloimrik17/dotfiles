## ADDED Requirements

### Requirement: gh extension install section

The chezmoi install script SHALL include a new confirmable group for gh CLI extensions, placed after the brew packages group. The section SHALL install `gh-dash` using `gh extension install dlvhdr/gh-dash`.

#### Scenario: Fresh install of gh-dash

- **WHEN** chezmoi apply runs and the user confirms the gh extensions group
- **THEN** `gh-dash` is installed via `gh extension install dlvhdr/gh-dash`

#### Scenario: gh-dash already installed

- **WHEN** chezmoi apply runs and gh-dash is already listed in `gh extension list`
- **THEN** the script skips installation and reports it as already installed

#### Scenario: gh CLI not available

- **WHEN** chezmoi apply runs but `gh` is not found in PATH
- **THEN** the script warns that gh is required and skips the extensions group

### Requirement: Shell alias

The zshrc SHALL define alias `gd="gh dash"` in the GitHub aliases section alongside `ghpr`, `ghpv`, and `ghpl`.

#### Scenario: User launches gh-dash via alias

- **WHEN** the user types `gd` in the terminal
- **THEN** `gh dash` is executed, opening the gh-dash TUI
