## ADDED Requirements

### Requirement: chezmoi init template prompts for machine-specific variables
The repo SHALL include a `.chezmoi.toml.tmpl` that prompts the user for machine-specific variables during `chezmoi init`. Variables SHALL include at minimum the user's name and email (for potential git config use).

#### Scenario: First-time init on a new machine
- **WHEN** user runs `chezmoi init --apply <repo>`
- **THEN** chezmoi prompts for machine-specific variables and stores them in `~/.config/chezmoi/chezmoi.toml`

#### Scenario: Re-init preserves existing values
- **WHEN** user runs `chezmoi init` on a machine that already has `chezmoi.toml`
- **THEN** chezmoi uses `promptStringOnce` so existing values are not re-asked

### Requirement: OS-conditional ignore rules
The repo SHALL include a `.chezmoiignore.tmpl` that excludes platform-specific files on non-matching OSes.

#### Scenario: macOS-only files ignored on Linux
- **WHEN** chezmoi applies on a Linux machine
- **THEN** files marked as macOS-only (e.g., configs using `macos-titlebar-style`) are not applied

#### Scenario: macOS machine receives all macOS files
- **WHEN** chezmoi applies on a macOS machine
- **THEN** all macOS-relevant configs are applied without exclusion

### Requirement: Repository structure follows chezmoi conventions
The repo root SHALL contain chezmoi source state files using chezmoi naming conventions (`dot_` prefix for dotfiles, `.tmpl` suffix for templates). No `.chezmoiroot` indirection — the repo root IS the source state.

#### Scenario: Repo layout maps to home directory
- **WHEN** a user inspects the repo root
- **THEN** they see `dot_config/`, `dot_zshrc.tmpl`, `dot_claude/` etc., each mapping directly to `~/` targets

### Requirement: Machine-local overrides are never managed
Files designated as machine-local overrides (e.g., `~/.claude/settings.local.json`) SHALL NOT be present in the chezmoi source state and SHALL NOT be touched during apply.

#### Scenario: settings.local.json untouched
- **WHEN** chezmoi apply runs on a machine that has `~/.claude/settings.local.json`
- **THEN** that file is not modified, overwritten, or removed
