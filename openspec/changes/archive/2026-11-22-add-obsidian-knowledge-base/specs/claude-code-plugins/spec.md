# Spec Delta

## ADDED Requirements

### Requirement: Obsidian skills plugin is installed

The managed Claude Code plugin installer SHALL register the `obsidianmd/obsidian-skills` marketplace once and install `obsidian@obsidian-skills`, Obsidian's official agent skills for its Markdown, Bases, JSON Canvas, CLI and Headless.

#### Scenario: Plugin is not yet installed

- **WHEN** the package installer runs on macOS with Claude Code available and `obsidian@obsidian-skills` absent
- **THEN** it registers `obsidianmd/obsidian-skills` once and installs `obsidian@obsidian-skills`

#### Scenario: Plugin is already installed

- **WHEN** the package installer runs and `obsidian@obsidian-skills` is already installed
- **THEN** it skips reinstallation

#### Scenario: Claude Code is unavailable

- **WHEN** the package installer runs and the Claude Code CLI is unavailable
- **THEN** it skips plugin installation without preventing later package groups from running

#### Scenario: Automatic plugin installation is unavailable

- **WHEN** the package installer renders its non-macOS manual instructions
- **THEN** the output includes the command that adds `obsidianmd/obsidian-skills` and installs `obsidian@obsidian-skills`

### Requirement: Obsidian skills plugin is enabled by default

The managed Claude Code settings SHALL enable `obsidian@obsidian-skills` and register the `obsidian-skills` marketplace from `obsidianmd/obsidian-skills` with automatic updates.

#### Scenario: Settings are rendered for a fresh configuration

- **WHEN** the managed Claude Code settings are rendered
- **THEN** `enabledPlugins` contains `"obsidian@obsidian-skills": true`
- **AND** `extraKnownMarketplaces."obsidian-skills"` points to the GitHub repo `obsidianmd/obsidian-skills` with `autoUpdate` enabled and no `ref`

#### Scenario: Settings are merged into an existing configuration

- **WHEN** managed settings are applied to a Claude Code configuration with unrelated enabled plugins and marketplaces
- **THEN** `obsidian@obsidian-skills` is enabled and the unrelated entries remain

#### Scenario: Plugin skills are available

- **WHEN** the installed plugin is active in a new Claude Code session
- **THEN** its skills, including `obsidian-cli` and `obsidian-markdown`, are available under the `obsidian` plugin namespace
