# Capability: codex-plugins

## Purpose

Provides a supported Codex plugin installation and verification path while leaving Codex-owned local runtime state outside chezmoi.

## Requirements

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

### Requirement: The installer registers the Codex marketplaces its plugins need

Before installing a plugin from a non-built-in marketplace, the installer SHALL register that marketplace with `codex plugin marketplace add`. It SHALL check by name against `codex plugin marketplace list --json` and skip a registered one. A failed query or add SHALL warn and skip that marketplace's plugins without failing the run. Registering through the Codex CLI does not count as chezmoi managing Codex state.

#### Scenario: Marketplace missing

- **WHEN** the user confirms the Codex plugin group and `codex plugin marketplace list --json` has no `obsidian-skills` marketplace
- **THEN** the installer runs `codex plugin marketplace add obsidianmd/obsidian-skills` before `codex plugin add obsidian@obsidian-skills`

#### Scenario: Marketplace already registered

- **WHEN** `codex plugin marketplace list --json` already lists `obsidian-skills`
- **THEN** the installer does not run `codex plugin marketplace add` for it

#### Scenario: Registration fails

- **WHEN** `codex plugin marketplace add obsidianmd/obsidian-skills` exits non-zero
- **THEN** the installer warns, skips `obsidian@obsidian-skills`, continues with the remaining plugins and does not fail the run

#### Scenario: Built-in marketplace plugins need no registration

- **WHEN** the installer installs `superpowers@openai-curated`
- **THEN** it runs no `codex plugin marketplace add`

### Requirement: Obsidian skills install in Codex

The Codex plugin list SHALL include `obsidian@obsidian-skills` from the `obsidianmd/obsidian-skills` marketplace, so Codex gets the same official Obsidian skills as Claude Code.

#### Scenario: Plugin missing

- **WHEN** the installer runs, the marketplace is registered, `obsidian@obsidian-skills` is not installed and the user confirms
- **THEN** it runs `codex plugin add obsidian@obsidian-skills`, and `codex plugin list --json` then reports it installed and enabled

#### Scenario: New session after installation

- **WHEN** a new Codex session starts after `obsidian@obsidian-skills` is installed
- **THEN** the session discovers the plugin's `obsidian-cli` skill

### Requirement: Expo installs in Codex

The Codex plugin list SHALL include `expo@openai-curated` from the built-in curated marketplace, so Codex gets the Expo skills without adding a custom marketplace.

#### Scenario: Plugin missing

- **WHEN** the installer runs, `expo@openai-curated` is not installed and the user confirms
- **THEN** it runs `codex plugin add expo@openai-curated` and no `codex plugin marketplace add`
