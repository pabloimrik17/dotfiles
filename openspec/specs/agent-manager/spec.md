# agent-manager Specification

## Purpose

Install and integrate the Agent of Empires (`aoe`) agent manager and the Conductor cask via the dotfiles' brew groups, ship a deliberate chezmoi-managed AoE config at `~/.agent-of-empires/config.toml`, and guarantee `aoe` is only ever launched on demand by the user (never automatically), since it opens an interactive TUI.

## Requirements

### Requirement: aoe binary is installed via the brew packages group

The install script `run_onchange_install-packages.sh.tmpl` SHALL include `aoe` in the `BREW_PACKAGES` array under the `{{ if eq .chezmoi.os "darwin" }}` branch. `aoe` SHALL be installed from `homebrew-core` (no `BREW_TAPS` entry required) using the same idempotency check applied to every other CLI in the array (`command -v aoe` → skip).

#### Scenario: aoe listed in BREW_PACKAGES

- **WHEN** the install script is loaded on a macOS host
- **THEN** the `BREW_PACKAGES` array contains `aoe`

#### Scenario: aoe maps to its own binary name

- **WHEN** `pkg_bin "aoe"` is called
- **THEN** the function returns `aoe` (via the default identity mapping; no dedicated `case` arm exists)

#### Scenario: Fresh install on macOS

- **WHEN** the brew packages group runs on a host where `command -v aoe` fails AND the user confirms the group prompt
- **THEN** `brew install aoe` is executed and `aoe` becomes available on PATH

#### Scenario: Idempotent re-run

- **WHEN** the brew packages group runs on a host where `command -v aoe` already succeeds
- **THEN** the script logs `aoe — already installed, skipping` and does NOT invoke `brew install aoe`

#### Scenario: Installation failure is non-fatal

- **WHEN** `brew install aoe` fails (e.g., formula unavailable, network error)
- **THEN** the script increments the error counter, logs `Failed to install aoe`, and continues with the remaining packages in `BREW_PACKAGES`

### Requirement: aoe is listed in the closing summary

The install script's final `info` line that enumerates installed CLI tools (printed under the macOS branch) SHALL include `aoe` after `mole` in the comma-separated CLI tools list.

#### Scenario: macOS summary mentions aoe

- **WHEN** the macOS branch of the install script completes successfully
- **THEN** the closing `info "Installation complete!"` block's `CLI tools:` line includes the token `aoe`

### Requirement: Non-macOS branch lists aoe in manual instructions

The `{{ else -}}` (non-macOS) branch of the install script SHALL include `aoe` in the comma-separated CLI tools enumeration printed for manual installation. `aoe` SHALL be installed via `cargo install aoe` (or distro package manager) on non-macOS systems per upstream guidance.

#### Scenario: Linux manual instructions include aoe

- **WHEN** the install script runs on a non-macOS system
- **THEN** the printed `CLI tools:` line lists `aoe` alongside the other portable CLI tools

#### Scenario: Linux closing summary lists aoe

- **WHEN** the non-macOS branch of the install script completes
- **THEN** the closing `info "Installation complete!"` block's `CLI tools:` line includes `aoe`

### Requirement: Conductor cask is installed only on Apple Silicon macOS

The `ALL_CASKS` array in the install script SHALL include a `conductor` entry (formatted as `"conductor|Conductor|AI|Claude code parallelisation"`) gated by a chezmoi template guard equivalent to `{{ if and (eq .chezmoi.os "darwin") (eq .chezmoi.arch "arm64") -}}`. On Intel Darwin and on non-Darwin systems the entry SHALL NOT be present in the rendered script.

#### Scenario: Apple Silicon Mac includes conductor in ALL_CASKS

- **WHEN** the install script is rendered on a macOS arm64 host
- **THEN** the `ALL_CASKS` array contains the entry `"conductor|Conductor|AI|Claude code parallelisation"`

#### Scenario: Intel Mac excludes conductor from ALL_CASKS

- **WHEN** the install script is rendered on a macOS amd64 host
- **THEN** the `ALL_CASKS` array does NOT contain any `conductor` entry

#### Scenario: Non-macOS excludes conductor

- **WHEN** the install script is rendered on a non-macOS host
- **THEN** the rendered file does NOT contain the literal string `conductor` anywhere (the cask group itself is gated out by the existing macOS branch)

#### Scenario: Fresh install on Apple Silicon Mac

- **WHEN** the cask group runs on an arm64 macOS host where `/Applications/Conductor.app` does NOT exist AND `brew list --cask conductor` fails AND the user selects `conductor` in the cask picker
- **THEN** `brew install --cask conductor` is executed

#### Scenario: Idempotent re-run

- **WHEN** the cask group runs on a host where `/Applications/Conductor.app` exists OR `brew list --cask conductor` succeeds
- **THEN** the entry is detected as installed by `is_cask_installed` and is excluded from the `PENDING_CASKS` list

### Requirement: AoE configuration is chezmoi-managed at `~/.agent-of-empires/config.toml`

The dotfiles source tree SHALL contain a `private_dot_agent-of-empires/config.toml` file targeting `~/.agent-of-empires/config.toml` (AoE reads from `~/.agent-of-empires/` on macOS, breaking the `~/.config/` convention). The file SHALL be applied unconditionally on `chezmoi apply` (no per-host gating).

#### Scenario: Config file present after chezmoi apply

- **WHEN** the user runs `chezmoi apply` on any supported host
- **THEN** `~/.agent-of-empires/config.toml` SHALL exist and be readable by the current user

#### Scenario: Config file is private (chezmoi `private_` prefix)

- **WHEN** `chezmoi apply` materializes the file
- **THEN** the resulting `~/.agent-of-empires/config.toml` SHALL have permissions `0600` or stricter

### Requirement: AoE config sets deliberate knobs for power use

The `~/.agent-of-empires/config.toml` managed by chezmoi SHALL contain the following table entries (or their schema-equivalent keys after `aoe init` verification):

- `[session]` with `default_tool = "claude"` and `agent_status_hooks = true`.
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

### Requirement: No automated invocations of `aoe` from any chezmoi-managed script

The dotfiles SHALL NOT invoke `aoe` from any chezmoi `run_*` script, git hook, shell startup file, alias, or other automated entry point. Because `aoe` opens an interactive TUI, every invocation MUST be initiated explicitly by the user typing `aoe`.

#### Scenario: No automated aoe invocation

- **WHEN** any file in the dotfiles source tree is searched for `aoe` as a command invocation (not as a string in `BREW_PACKAGES`, an `info` line, a manual-instruction line, or a comment)
- **THEN** zero matches are found — `aoe` appears only in install-script package lists, the closing summary, manual-instruction lines, and user-facing docs

### Requirement: AoE config path is verified at first install

The implementation tasks SHALL include a manual verification step that runs `aoe init` (or equivalent) on a clean state and confirms AoE reads from `~/.agent-of-empires/config.toml` on macOS. If verification reveals a different path (e.g., `~/.config/agent-of-empires/`), the chezmoi target SHALL be relocated accordingly and this spec SHALL be updated via a follow-up delta.

#### Scenario: Verified path is `~/.agent-of-empires/`

- **WHEN** the user runs `aoe init` on a host without an existing config and inspects which file AoE creates or reads
- **THEN** the path is `~/.agent-of-empires/config.toml`
- **AND** no change to the chezmoi target is required

#### Scenario: Verified path differs from documented expectation

- **WHEN** verification reveals AoE actually reads from a different path
- **THEN** the chezmoi source path is moved accordingly AND a follow-up change updates this spec to reference the verified path

### Requirement: AoE launches claude under the project Node version

AoE-launched claude sessions SHALL pick up the project's Node version through the `claude-node-launch` shim. Because AoE runs the agent in a sandbox with an environment passthrough allowlist (not the user's interactive shell), the AoE config managed by chezmoi SHALL include `NVM_DIR` in its sandbox `environment` passthrough so the shim can resolve the version from the filesystem (`$NVM_DIR/versions/node/`) without needing the `nvm` shell function. AoE SHALL invoke `claude` such that the PATH shim intercepts it — either by preserving the shim's PATH ordering inside the sandbox, or via an agent-command override pointing at the shim if AoE supports one.

#### Scenario: NVM_DIR is in the AoE sandbox environment passthrough

- **WHEN** the AoE `config.toml` is rendered by chezmoi
- **THEN** the sandbox `environment` passthrough list names `NVM_DIR` (in addition to the existing `CLAUDE_CONFIG_DIR`, `EDITOR`, `TERM`, `COLORTERM`)

#### Scenario: AoE-launched claude uses the project Node

- **WHEN** a worktree pinned to a non-default Node version (via `.nvmrc`) is launched as an AoE session
- **THEN** the claude process started by AoE, and its subprocesses, resolve the project's pinned Node version rather than the nvm default
