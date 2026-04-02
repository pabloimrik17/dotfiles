## ADDED Requirements

### Requirement: Television installation
The install script SHALL include `television` in the brew packages and `jq` as a dependency (if not already present).

#### Scenario: Fresh install includes television
- **WHEN** user runs the install script and confirms the brew packages group
- **THEN** `television` and `jq` are installed via Homebrew

### Requirement: Base configuration
A config file SHALL exist at `dot_config/television/config.toml` with Catppuccin theme and shell integration enabled.

#### Scenario: Theme is Catppuccin
- **WHEN** television launches
- **THEN** the UI uses the catppuccin color theme

#### Scenario: Shell integration keybindings
- **WHEN** user opens a new zsh shell
- **THEN** Ctrl+T activates television contextual autocomplete

### Requirement: Zsh initialization
`dot_zshrc.tmpl` SHALL include `eval "$(tv init zsh)"` to enable television shell integration. This line SHALL appear AFTER fzf initialization and BEFORE zoxide initialization.

#### Scenario: Television initializes after fzf
- **WHEN** a new zsh shell starts
- **THEN** television's Ctrl+T overrides fzf's Ctrl+T for contextual autocomplete

#### Scenario: Television does not affect atuin
- **WHEN** a new zsh shell starts
- **THEN** Ctrl+R is still handled by atuin (not television)
