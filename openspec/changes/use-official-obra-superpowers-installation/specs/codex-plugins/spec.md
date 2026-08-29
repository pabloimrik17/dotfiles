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

### Requirement: Codex plugin state remains runtime-owned

The dotfiles SHALL NOT manage Codex plugin configuration, installation records, bundles, or cache paths under `~/.codex`; Codex SHALL own that per-environment runtime state.

#### Scenario: Chezmoi applies the dotfiles

- **WHEN** `chezmoi apply` runs after Superpowers is installed in Codex
- **THEN** it neither creates nor modifies Codex plugin files or cache entries

### Requirement: Fresh Codex sessions discover Superpowers skills

After Superpowers is installed, a new Codex session SHALL discover the plugin's bundled skills and allow `using-superpowers` to be invoked.

#### Scenario: New session starts after installation

- **WHEN** Codex is fully restarted and a fresh session begins
- **THEN** the session can discover and invoke the bundled `using-superpowers` skill
