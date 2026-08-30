## Purpose

Provides a supported Codex plugin installation and verification path while leaving Codex-owned local runtime state outside chezmoi.

## ADDED Requirements

### Requirement: Superpowers installs from the built-in curated marketplace

An installed and authenticated Codex CLI whose workspace policy makes the plugin available to the user's role SHALL expose `superpowers@openai-curated` through its built-in marketplace and SHALL support installing it with `codex plugin add superpowers@openai-curated` without adding a custom marketplace.

#### Scenario: Official plugin is available

- **WHEN** an authenticated user whose workspace policy allows the plugin lists available Codex plugins
- **THEN** `superpowers@openai-curated` appears as an available plugin

#### Scenario: Workspace policy withholds the plugin

- **WHEN** the user's workspace policy does not make `superpowers@openai-curated` available to their role
- **THEN** it does not appear as available, and installation requires a workspace administrator to make it available

#### Scenario: Official plugin is installed

- **WHEN** the user runs `codex plugin add superpowers@openai-curated`
- **THEN** `codex plugin list --json` reports the plugin as installed and enabled

### Requirement: The installer provisions Codex plugins idempotently

The package installer SHALL install every entry of its Codex plugin list with `codex plugin add`, skipping entries Codex already reports as installed. It SHALL detect installed plugins from the `installed` array of `codex plugin list --json`, and SHALL skip the group with a warning when `codex` or `jq` is unavailable, when the plugin query fails, or when its output is unreadable. It SHALL warn rather than reinstall when a listed plugin is installed but disabled. A failed `codex plugin add` SHALL warn rather than count as an installation error, since a managed workspace can withhold a plugin from the user's role.

#### Scenario: Every listed plugin is already installed

- **WHEN** the installer runs and Codex reports each listed plugin as installed
- **THEN** it reports the installed count and neither prompts nor runs `codex plugin add`

#### Scenario: A listed plugin is missing

- **WHEN** the installer runs, a listed plugin is absent, and the user confirms
- **THEN** it runs `codex plugin add` for the missing plugin only

#### Scenario: A plugin is available but not installed

- **WHEN** `codex plugin list --available --json` reports a listed plugin only in its `available` array
- **THEN** the installer treats it as pending rather than as installed

#### Scenario: Installation is refused

- **WHEN** `codex plugin add` fails for a listed plugin
- **THEN** the installer warns with administrator guidance, continues with the remaining plugins, and does not fail the run

#### Scenario: The plugin query fails

- **WHEN** `codex plugin list --json` exits non-zero, or returns output whose `installed` field is absent or not an array
- **THEN** the installer warns and skips the group instead of treating the inventory as empty

#### Scenario: A listed plugin is installed but disabled

- **WHEN** Codex reports a listed plugin as installed with `enabled` false
- **THEN** the installer warns and leaves it alone rather than reinstalling it

#### Scenario: A prerequisite is missing

- **WHEN** the installer runs without `codex` or without `jq` on PATH
- **THEN** it warns and skips the Codex plugin group without failing the run

### Requirement: Codex plugin state remains runtime-owned

The dotfiles SHALL NOT manage Codex plugin configuration, installation records, bundles, or cache paths under `~/.codex`; Codex SHALL own that per-environment runtime state. Driving the official `codex plugin` CLI SHALL NOT count as managing that state.

#### Scenario: Chezmoi applies the dotfiles

- **WHEN** `chezmoi apply` runs after Superpowers is installed in Codex
- **THEN** it neither creates nor modifies Codex plugin files or cache entries

### Requirement: Fresh Codex sessions discover Superpowers skills

After Superpowers is installed, a new Codex session SHALL discover the plugin's bundled skills and allow `using-superpowers` to be invoked.

#### Scenario: New session starts after installation

- **WHEN** Codex is fully restarted and a fresh session begins
- **THEN** the session can discover and invoke the bundled `using-superpowers` skill
