# Capability: atuin-config

## Purpose

Atuin shell history configuration managed by chezmoi — daemon mode, autostart, AI features, and history import on fresh machines.

## Requirements

### Requirement: Chezmoi-managed atuin configuration

A configuration file SHALL be managed by chezmoi at `dot_config/atuin/config.toml`, targeting `~/.config/atuin/config.toml`. The file SHALL only set non-default values — atuin defaults are not replicated.

#### Scenario: Config applied on fresh machine

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.config/atuin/config.toml` SHALL exist with daemon and AI configuration

#### Scenario: Config does not replicate defaults

- **WHEN** the managed config file is read
- **THEN** it SHALL only contain keys whose values differ from atuin compiled defaults

### Requirement: Daemon mode enabled with autostart

The config SHALL enable daemon mode via `daemon.enabled = true` and automatic startup via `daemon.autostart = true` under the `[daemon]` section. This ensures the CLI automatically starts and manages the daemon process — no launchd service or manual startup required.

#### Scenario: Daemon auto-starts on first command

- **WHEN** the user opens a new shell session and runs a command
- **THEN** the atuin CLI SHALL automatically start the daemon if not already running

#### Scenario: History end requires daemon

- **WHEN** a command completes and `_atuin_precmd` calls `atuin history end`
- **THEN** the daemon SHALL be available to persist the completed history record

#### Scenario: Search uses in-memory index

- **WHEN** the user presses Ctrl+R to search history
- **THEN** atuin SHALL use the daemon's in-memory index for faster results

### Requirement: AI features enabled

The config SHALL enable AI features via `ai.enabled = true` under the `[ai]` section. The `ai.send_cwd` key SHALL remain at its default (`false`) — only OS and shell info are transmitted.

#### Scenario: AI command generation available

- **WHEN** the user runs `atuin ai "find large files modified this week"`
- **THEN** atuin SHALL return a suggested command based on the user's shell history and system context

#### Scenario: No working directory sent to AI

- **WHEN** the user invokes atuin AI
- **THEN** the current working directory SHALL NOT be included in the data sent to the AI endpoint

### Requirement: AI shell integration in .zshrc

The `.zshrc` SHALL include `eval "$(atuin ai init zsh)"` to enable the `?` prefix for natural language command generation in the shell.

#### Scenario: Natural language command generation

- **WHEN** the user types `?` at the start of a shell line
- **THEN** atuin AI inline mode SHALL activate, allowing natural language input to generate shell commands

### Requirement: Shell history imported on fresh machines

The install script SHALL run `atuin import auto` after brew packages are installed if atuin has zero history entries. This ensures autosuggestions work immediately on fresh machines by importing existing zsh history.

#### Scenario: Fresh machine with existing zsh history

- **WHEN** `chezmoi apply` runs the install script and atuin has no history entries
- **THEN** `atuin import auto` is executed to import existing shell history

#### Scenario: History already present

- **WHEN** atuin already has history entries
- **THEN** the import step is skipped
