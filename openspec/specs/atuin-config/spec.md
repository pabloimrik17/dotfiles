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

`ai.enabled = true` matches the compiled default and would otherwise fall foul of this file's "only non-default values" convention. It is retained deliberately as a stated exception: with the separate AI init line removed, this key is the only thing keeping the `?` widget alive, so pinning it guards against an upstream default flip silently removing the binding.

#### Scenario: AI command generation available

- **WHEN** the user runs `atuin ai "find large files modified this week"`
- **THEN** atuin SHALL return a suggested command based on the user's shell history and system context

#### Scenario: No working directory sent to AI

- **WHEN** the user invokes atuin AI
- **THEN** the current working directory SHALL NOT be included in the data sent to the AI endpoint

#### Scenario: Explicit value survives an upstream default change

- **WHEN** a future atuin release changes the compiled default for `ai.enabled`
- **THEN** the managed config SHALL continue to enable AI features, and the `?` widget SHALL remain bound

### Requirement: AI shell integration in .zshrc

The `?` prefix for natural language command generation SHALL be available in interactive shells. It is provided by the main `atuin init zsh` integration; the `.zshrc` SHALL NOT carry a separate `atuin ai init zsh` line.

The two emit byte-identical widget and keybinding definitions, so the separate line only spawned a second subprocess on every shell start to redefine the same widget.

Emission is conditional: `atuin init zsh` includes the AI block only while AI features are enabled in the config and `ATUIN_NOBIND` is unset. With the separate line gone, the config key is the sole guard on the widget's existence.

#### Scenario: Natural language command generation

- **WHEN** the user types `?` at the start of a shell line
- **THEN** atuin AI inline mode SHALL activate, allowing natural language input to generate shell commands

#### Scenario: No duplicate initialization

- **WHEN** a new interactive shell starts
- **THEN** the AI widget SHALL be defined exactly once, by the main atuin integration

### Requirement: Shell history imported on fresh machines

The install script SHALL run `atuin import auto` after brew packages are installed if atuin has zero history entries. This ensures autosuggestions work immediately on fresh machines by importing existing zsh history.

#### Scenario: Fresh machine with existing zsh history

- **WHEN** `chezmoi apply` runs the install script and atuin has no history entries
- **THEN** `atuin import auto` is executed to import existing shell history

#### Scenario: History already present

- **WHEN** atuin already has history entries
- **THEN** the import step is skipped

### Requirement: AI permission grants are chezmoi-managed

The atuin AI permissions file SHALL be part of the chezmoi source tree and SHALL be materialized with owner-only permissions.

The file records standing, no-prompt capability grants to the AI assistant. Left unmanaged it is invisible to review: it does not appear in `chezmoi status`, is absent from the repo's documentation, and atuin's own interface appends to it as the user accepts prompts, so the granted set widens over time with no record.

#### Scenario: Permissions file is managed

- **WHEN** `chezmoi apply` runs
- **THEN** the atuin AI permissions file SHALL be materialized from the chezmoi source

#### Scenario: Grants are reviewable

- **WHEN** a maintainer inspects the chezmoi source
- **THEN** the set of standing grants to the AI assistant SHALL be readable from the source tree

#### Scenario: File is private

- **WHEN** chezmoi materializes the file
- **THEN** it SHALL have permissions `0600` or stricter

