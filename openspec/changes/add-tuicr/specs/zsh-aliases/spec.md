# Delta: zsh-aliases

## ADDED Requirements

### Requirement: tuicr aliases

The zshrc SHALL define two tuicr aliases alongside the other git/GitHub tooling aliases: `tcr` (bare `tuicr`, opens the commit selector) and `tcrw` (`tuicr -w`, reviews the uncommitted working tree).

#### Scenario: tcr opens tuicr

- **WHEN** the user types `tcr` inside a git repository
- **THEN** tuicr opens with its commit selector

#### Scenario: tcrw reviews the working tree

- **WHEN** the user types `tcrw` in a repository with uncommitted changes
- **THEN** tuicr opens on the working-tree diff
