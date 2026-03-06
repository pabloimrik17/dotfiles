## ADDED Requirements

### Requirement: Worktrunk brew installation

The install script SHALL include `worktrunk` in the Group 1 brew packages array. The binary name for idempotent check SHALL be `wt`.

#### Scenario: Fresh install on macOS

- **WHEN** the user runs `chezmoi apply` on a macOS machine without worktrunk installed
- **THEN** the install script SHALL install worktrunk via `brew install worktrunk`

#### Scenario: Already installed

- **WHEN** the `wt` binary is already available on PATH
- **THEN** the install script SHALL skip installation and print "worktrunk — already installed, skipping"

### Requirement: Shell integration in zshrc

The `.zshrc` template SHALL include worktrunk shell integration via an eval line in the "Modern CLI Tools" section. The eval MUST be guarded by a command existence check to avoid errors if worktrunk is not installed.

#### Scenario: Worktrunk installed

- **WHEN** chezmoi applies `.zshrc` and `wt` is available on PATH
- **THEN** the shell SHALL evaluate `wt config shell init zsh` to enable directory-changing and completions

#### Scenario: Worktrunk not installed

- **WHEN** chezmoi applies `.zshrc` and `wt` is not available on PATH
- **THEN** the shell SHALL silently skip the worktrunk eval without errors

### Requirement: Non-macOS manual instructions

The install script SHALL list worktrunk in the non-macOS manual instructions section with both brew and cargo install options.

#### Scenario: Running on Linux

- **WHEN** the install script runs on a non-macOS system
- **THEN** the output SHALL include worktrunk in the list of tools to install manually with `brew install worktrunk` or `cargo install worktrunk`
