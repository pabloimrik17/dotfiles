# agent-manager Delta

## REMOVED Requirements

### Requirement: AoE configuration is chezmoi-managed at `~/.agent-of-empires/config.toml`

**Reason**: AoE 1.10.1 added XDG config support on macOS (upstream PR #1968, designed for dotfile managers); the config relocates to `~/.config/agent-of-empires/`, removing the documented "breaking the `~/.config/` convention" wart.
**Migration**: Quit aoe, `mv ~/.agent-of-empires ~/.config/agent-of-empires` BEFORE applying the renamed source (an existing XDG dir outranks the legacy dir), `git mv private_dot_agent-of-empires dot_config/private_agent-of-empires`, update `.oxfmtignore` and `.chezmoiignore` paths.

## ADDED Requirements

### Requirement: AoE configuration is chezmoi-managed at `~/.config/agent-of-empires/config.toml`

The dotfiles source tree SHALL contain a `dot_config/private_agent-of-empires/config.toml` management (modify_ script) targeting `~/.config/agent-of-empires/config.toml` (AoE ≥1.10.1 reads `$XDG_CONFIG_HOME/agent-of-empires/` on macOS when that directory exists, preferring it over the legacy `~/.agent-of-empires/`). The file SHALL be applied unconditionally on `chezmoi apply` (no per-host gating). No `~/.agent-of-empires/` directory SHALL remain after migration (its presence alongside the XDG dir would strand legacy state).

#### Scenario: Config file present after chezmoi apply

- **WHEN** the user runs `chezmoi apply` on any supported host
- **THEN** `~/.config/agent-of-empires/config.toml` SHALL exist and be readable by the current user

#### Scenario: Config file is private (chezmoi `private_` attribute)

- **WHEN** `chezmoi apply` materializes the file
- **THEN** the resulting `~/.config/agent-of-empires/config.toml` SHALL have permissions `0600` or stricter

#### Scenario: Legacy dir absent after migration

- **WHEN** the migration has run on a host that previously used `~/.agent-of-empires/`
- **THEN** `~/.agent-of-empires/` no longer exists and aoe reads (and writes runtime state to) `~/.config/agent-of-empires/`

## MODIFIED Requirements

### Requirement: AoE config sets deliberate knobs for power use

The `~/.config/agent-of-empires/config.toml` managed by chezmoi SHALL contain the following table entries (or their schema-equivalent keys after `aoe init` verification):

- `[session]` with `default_tool = "claude"`, `agent_status_hooks = true`, and `confirm_delete = true` (AoE 1.12.0: confirmation guard before deleting a session from the TUI).
- `[acp]` with `rate_limit_auto_resume = true` (AoE 1.10.1: opt-in daemon auto-resume of ACP sessions once the adapter-reported rate-limit reset time passes).
- `[status_hooks]` with `on_waiting` and `on_idle` commands that invoke `terminal-notifier` (already provided by `cli-tool-expansion`).
- `[worktree]` with `init_submodules = false`.
- `[tmux]` with `status_bar = "disabled"` (user owns `~/.tmux.conf`).
- `[updates]` with `update_check_mode = "off"` (updates flow through brew + chezmoi).
- An `environment` passthrough list including `CLAUDE_CONFIG_DIR`, `EDITOR`, `TERM`, and `COLORTERM`.

The config MAY include a `[theme]` block matching the rest of the dotfiles' Catppuccin Mocha palette if AoE offers an equivalent named theme; otherwise the theme block SHALL be omitted (defaults are acceptable).

#### Scenario: default_tool set to claude

- **WHEN** the config file is rendered by chezmoi
- **THEN** the rendered file contains `default_tool = "claude"` under a `[session]` table

#### Scenario: agent_status_hooks enabled

- **WHEN** the config file is rendered by chezmoi
- **THEN** the rendered file contains `agent_status_hooks = true` under a `[session]` table

#### Scenario: Session delete guarded

- **WHEN** the config file is rendered by chezmoi
- **THEN** the rendered file contains `confirm_delete = true` under a `[session]` table

#### Scenario: Rate-limited ACP sessions auto-resume

- **WHEN** the config file is rendered by chezmoi
- **THEN** the rendered file contains `rate_limit_auto_resume = true` under an `[acp]` table

#### Scenario: status_hooks use terminal-notifier

- **WHEN** the config file is rendered by chezmoi
- **THEN** the rendered file contains both `on_waiting` and `on_idle` keys under a `[status_hooks]` table, and each value invokes the `terminal-notifier` binary

#### Scenario: init_submodules disabled

- **WHEN** the config file is rendered by chezmoi
- **THEN** the rendered file contains `init_submodules = false` under a `[worktree]` table

#### Scenario: tmux status bar disabled

- **WHEN** the config file is rendered by chezmoi
- **THEN** the rendered file contains `status_bar = "disabled"` under a `[tmux]` table

#### Scenario: Update check disabled

- **WHEN** the config file is rendered by chezmoi
- **THEN** the rendered file contains `update_check_mode = "off"` under an `[updates]` table

#### Scenario: Environment passthrough includes Claude variables

- **WHEN** the config file is rendered by chezmoi
- **THEN** the rendered file contains an `environment` list (or table) that names `CLAUDE_CONFIG_DIR`, `EDITOR`, `TERM`, and `COLORTERM`

### Requirement: AoE config path is verified at first install

The implementation tasks SHALL include a manual verification step confirming AoE reads from `~/.config/agent-of-empires/config.toml` on macOS (AoE ≥1.10.1 prefers `$XDG_CONFIG_HOME/agent-of-empires/` when the directory exists; the legacy `~/.agent-of-empires/` is only used when no XDG dir exists). If verification reveals different precedence, the chezmoi target SHALL be relocated accordingly and this spec SHALL be updated via a follow-up delta.

#### Scenario: Verified path is `~/.config/agent-of-empires/`

- **WHEN** the user launches `aoe` on a host where `~/.config/agent-of-empires/` exists and `~/.agent-of-empires/` does not
- **THEN** AoE reads and writes `~/.config/agent-of-empires/config.toml`
- **AND** no change to the chezmoi target is required

#### Scenario: Verified path differs from documented expectation

- **WHEN** verification reveals AoE actually reads from a different path
- **THEN** the chezmoi source path is moved accordingly AND a follow-up change updates this spec to reference the verified path

### Requirement: AoE forces tmux clipboard passthrough

The AoE config (`~/.config/agent-of-empires/config.toml`, chezmoi-managed) SHALL set `[tmux].clipboard = "enabled"` so AoE applies `set-clipboard on` and `allow-passthrough on` to its tmux sessions, letting OSC 52 clipboard writes from wrapped agents reach the terminal. The default `"auto"` is a no-op when a user-owned `~/.tmux.conf` exists.

#### Scenario: Clipboard passthrough enabled

- **WHEN** the AoE config is rendered by chezmoi
- **THEN** it contains `clipboard = "enabled"` under a `[tmux]` table

### Requirement: AoE config preserves runtime writeback under chezmoi

The chezmoi management of `~/.config/agent-of-empires/config.toml` SHALL preserve AoE's runtime writeback tables (`[app_state]`, `[web]`, `[cockpit]`, `[logging]`, and default-expanded keys) rather than clobbering them on `chezmoi apply`, while still enforcing the deliberately-managed keys (`[theme]`, `[session]`, `[acp]`, `[worktree]`, `[tmux]`, `[updates]`, `[status_hooks]`, `[sandbox]`, `[sound]`, `[tools.lazygit]`). The chezmoi target file SHALL remain mode `0600`.

#### Scenario: Apply does not drop AoE runtime state

- **WHEN** AoE has written runtime tables (e.g. `[app_state]`, `[web]`) into the live config and the user runs `chezmoi apply`
- **THEN** those runtime tables remain present in `~/.config/agent-of-empires/config.toml`
- **AND** the deliberately-managed keys reflect the chezmoi-managed values

#### Scenario: Re-apply is quiet (no churn)

- **WHEN** the deliberately-managed keys already hold the chezmoi-managed values and `chezmoi apply` / `chezmoi diff` runs again (including after AoE has only rewritten its own runtime tables)
- **THEN** the management reproduces the on-disk file with no formatting churn and `chezmoi diff` reports no changes to any non-managed table

#### Scenario: Managed config stays private

- **WHEN** chezmoi materializes the config
- **THEN** `~/.config/agent-of-empires/config.toml` has permissions `0600` or stricter

### Requirement: AoE uses a Catppuccin Mocha theme

The AoE config SHALL set `[theme].name = "catppuccin-mocha"` referencing a chezmoi-managed custom theme at `dot_config/private_agent-of-empires/themes/catppuccin-mocha.toml` (AoE ships no built-in Catppuccin dark theme), aligning AoE with the rest of the Catppuccin Mocha stack. `color_mode` SHALL remain `truecolor`. The theme SHALL define `unread = "#94e2d5"` (Mocha teal) so the unread session state introduced in AoE 1.11.2 is distinguishable from accent-colored elements (omitting the key falls back to the theme accent, blue `#89b4fa`, which this theme already uses for accent/title/hint) while respecting AoE's waiting > unread > idle luminance ordering.

#### Scenario: Custom Mocha theme referenced

- **WHEN** the AoE config is rendered by chezmoi
- **THEN** `[theme].name = "catppuccin-mocha"` and a chezmoi-managed `themes/catppuccin-mocha.toml` exists

#### Scenario: Unread sessions visually distinct

- **WHEN** the theme file is rendered by chezmoi
- **THEN** it contains `unread = "#94e2d5"`
