## Purpose

Provides a supported Codex plugin installation and verification path while leaving Codex-owned local runtime state outside chezmoi.

## ADDED Requirements

### Requirement: Superpowers installs from the built-in curated marketplace

An installed and authenticated Codex CLI SHALL expose `superpowers@openai-curated` through its built-in marketplace and SHALL support installing it with `codex plugin add superpowers@openai-curated` without adding a custom marketplace.

#### Scenario: Official plugin is available

- **WHEN** an authenticated user lists available Codex plugins
- **THEN** `superpowers@openai-curated` appears as an available plugin

#### Scenario: Official plugin is installed

- **WHEN** the user runs `codex plugin add superpowers@openai-curated`
- **THEN** `codex plugin list --json` reports the plugin as installed and enabled

### Requirement: The installer provisions Codex plugins idempotently

The package installer SHALL install every entry of its Codex plugin list with `codex plugin add`, skipping entries Codex already reports as installed. It SHALL detect installed plugins from the `installed` array of `codex plugin list --json`, and SHALL skip the group with a warning when either `codex` or `jq` is unavailable.

#### Scenario: Every listed plugin is already installed

- **WHEN** the installer runs and Codex reports each listed plugin as installed
- **THEN** it reports the installed count and neither prompts nor runs `codex plugin add`

#### Scenario: A listed plugin is missing

- **WHEN** the installer runs, a listed plugin is absent, and the user confirms
- **THEN** it runs `codex plugin add` for the missing plugin only

#### Scenario: A plugin is available but not installed

- **WHEN** `codex plugin list --json` reports a listed plugin only in its `available` array
- **THEN** the installer treats it as pending rather than as installed

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
