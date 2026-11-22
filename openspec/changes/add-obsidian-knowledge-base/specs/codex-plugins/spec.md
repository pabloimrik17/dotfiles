# Spec Delta

## ADDED Requirements

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
