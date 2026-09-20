## ADDED Requirements

### Requirement: claude-swap global account aliases

The zshrc SHALL define `cs-list` as `cswap ls`, `cs-current` as `cswap status`, and `cs-global` as `cswap switch`. The alias names and documentation SHALL make clear that `cs-global` changes Claude Code's global active identity and does not launch an isolated `cswap run` session.

#### Scenario: List managed accounts

- **WHEN** the user runs `cs-list`
- **THEN** zsh executes `cswap ls`

#### Scenario: Inspect active account

- **WHEN** the user runs `cs-current`
- **THEN** zsh executes `cswap status`

#### Scenario: Switch globally by native alias

- **WHEN** the user runs `cs-global personal` or `cs-global work`
- **THEN** zsh executes `cswap switch` with the supplied native account alias
- **AND** the command changes the default global account rather than starting Claude

#### Scenario: Alias names are collision-free

- **WHEN** a new interactive shell loads the managed zshrc
- **THEN** all three aliases resolve to their intended claude-swap commands without overriding an existing managed command

