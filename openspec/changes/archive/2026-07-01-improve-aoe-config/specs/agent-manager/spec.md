<!-- DELTA NOTE: agent-manager is defined by the in-progress `agent-management-strategy`
     change and is not yet in openspec/specs/. Per design.md D5, these ADDED requirements
     validate only after that change is archived/synced. -->

## ADDED Requirements

### Requirement: AoE forces tmux clipboard passthrough

The AoE config (`~/.agent-of-empires/config.toml`, chezmoi-managed) SHALL set `[tmux].clipboard = "enabled"` so AoE applies `set-clipboard on` and `allow-passthrough on` to its tmux sessions, letting OSC 52 clipboard writes from wrapped agents reach the terminal. The default `"auto"` is a no-op when a user-owned `~/.tmux.conf` exists.

#### Scenario: Clipboard passthrough enabled

- **WHEN** the AoE config is rendered by chezmoi
- **THEN** it contains `clipboard = "enabled"` under a `[tmux]` table

### Requirement: AoE tmux mouse mode is deterministic

The AoE config SHALL set `[tmux].mouse = "disabled"` so AoE never touches tmux mouse mode, leaving the user-owned `~/.tmux.conf` (`mouse on`) authoritative on AoE sessions, mirroring the existing `status_bar = "disabled"` rationale.

#### Scenario: Mouse mode pinned

- **WHEN** the AoE config is rendered by chezmoi
- **THEN** it contains `mouse = "disabled"` under a `[tmux]` table

### Requirement: AoE notifies on session error

The AoE config `[status_hooks]` table SHALL include an `on_error` command that invokes `terminal-notifier` with a distinct sound, so an errored/crashed session is notified differently from `on_waiting` and `on_idle`.

#### Scenario: on_error hook present

- **WHEN** the AoE config is rendered by chezmoi
- **THEN** `[status_hooks]` contains an `on_error` key whose value invokes `terminal-notifier`

### Requirement: AoE config preserves runtime writeback under chezmoi

The chezmoi management of `~/.agent-of-empires/config.toml` SHALL preserve AoE's runtime writeback tables (`[app_state]`, `[web]`, `[cockpit]`, `[logging]`, and default-expanded keys) rather than clobbering them on `chezmoi apply`, while still enforcing the deliberately-managed keys (`[theme]`, `[session]`, `[worktree]`, `[tmux]`, `[updates]`, `[status_hooks]`, `[sandbox]`, `[sound]`, `[tools.lazygit]`). The chezmoi target file SHALL remain mode `0600`.

#### Scenario: Apply does not drop AoE runtime state

- **WHEN** AoE has written runtime tables (e.g. `[app_state]`, `[web]`) into the live config and the user runs `chezmoi apply`
- **THEN** those runtime tables remain present in `~/.agent-of-empires/config.toml`
- **AND** the deliberately-managed keys reflect the chezmoi-managed values

#### Scenario: Re-apply is quiet (no churn)

- **WHEN** the deliberately-managed keys already hold the chezmoi-managed values and `chezmoi apply` / `chezmoi diff` runs again (including after AoE has only rewritten its own runtime tables)
- **THEN** the management reproduces the on-disk file with no formatting churn and `chezmoi diff` reports no changes to any non-managed table

#### Scenario: Managed config stays private

- **WHEN** chezmoi materializes the config
- **THEN** `~/.agent-of-empires/config.toml` has permissions `0600` or stricter

### Requirement: AoE uses a Catppuccin Mocha theme

The AoE config SHALL set `[theme].name = "catppuccin-mocha"` referencing a chezmoi-managed custom theme at `private_dot_agent-of-empires/themes/catppuccin-mocha.toml` (AoE ships no built-in Catppuccin dark theme), aligning AoE with the rest of the Catppuccin Mocha stack. `color_mode` SHALL remain `truecolor`.

#### Scenario: Custom Mocha theme referenced

- **WHEN** the AoE config is rendered by chezmoi
- **THEN** `[theme].name = "catppuccin-mocha"` and a chezmoi-managed `themes/catppuccin-mocha.toml` exists

### Requirement: AoE plays state-transition sounds

The AoE config `[sound]` table SHALL enable state-transition audio so parallel-session state changes are audible. Sound assets installed by `aoe sounds install` live outside chezmoi and SHALL be excluded via `.chezmoiignore`.

#### Scenario: Sound enabled in config

- **WHEN** the AoE config is rendered by chezmoi
- **THEN** `[sound]` has `enabled = true`

### Requirement: AoE exposes a lazygit tool-session hotkey

The AoE config SHALL define a `[tools.lazygit]` tool-session bound to `Alt+g` (lazygit is already installed), giving an in-AoE git UI scoped to the session worktree. The hotkey SHALL NOT collide with existing ghostty, tmux, or AoE built-in bindings.

#### Scenario: lazygit tool-session defined

- **WHEN** the AoE config is rendered by chezmoi
- **THEN** `[tools.lazygit]` has `command = "lazygit"` and `hotkey = "Alt+g"`
