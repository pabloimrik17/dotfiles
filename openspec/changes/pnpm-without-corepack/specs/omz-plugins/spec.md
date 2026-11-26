# Spec Delta

## MODIFIED Requirements

### Requirement: Existing manual configuration is preserved

All manual configuration not superseded by plugins SHALL remain unchanged.

#### Scenario: Custom aliases unchanged

- **WHEN** `dot_zshrc.tmpl` is processed
- **THEN** all alias blocks (eza, bat, zoxide, git, GitHub CLI, ripgrep, utility) SHALL remain exactly as they were before this change

#### Scenario: Tool initializations unchanged

- **WHEN** `dot_zshrc.tmpl` is processed
- **THEN** the `starship init`, `zoxide init`, `atuin init`, fzf configuration, and zsh-autosuggestions/syntax-highlighting source blocks SHALL remain unchanged

#### Scenario: PATH and environment exports unchanged

- **WHEN** `dot_zshrc.tmpl` is processed
- **THEN** `PNPM_HOME`, `BUN_INSTALL`, and their PATH additions SHALL remain in place and SHALL NOT be superseded by a plugin
- **AND** pnpm's PATH additions SHALL follow the `pnpm-install` capability
