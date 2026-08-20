# Delta: claude-code-plugins

## ADDED Requirements

### Requirement: Fallow-skills marketplace and plugin are registered in install script

The install script SHALL include `fallow-rs/fallow-skills` in the `CC_MARKETPLACES` array and the fallow-skills plugin in the `CC_PLUGINS` array, installed via the existing marketplace/plugin loops (`claude plugin marketplace add`, `claude plugin install fallow@fallow-skills`), with the same pre-scan skip-if-installed behavior as the other entries.

#### Scenario: Fresh machine setup

- **WHEN** the install script runs the Claude Code plugin dependencies group on a machine without the plugin
- **THEN** the fallow-skills marketplace is registered and the plugin installed

#### Scenario: Already installed

- **WHEN** the marketplace and plugin are already present
- **THEN** both are skipped with "already registered/installed" messages

### Requirement: Fallow-skills plugin is enabled by default

The managed key set of `dot_claude/modify_settings.json.tmpl` SHALL include the fallow-skills plugin entry (`"fallow@fallow-skills": true`, exact key as reported by `claude plugin list --json`) in the `enabledPlugins` object.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` runs on a machine without Claude Code settings
- **THEN** the rendered `~/.claude/settings.json` contains `fallow@fallow-skills` in `enabledPlugins`

#### Scenario: Plugin not installed

- **WHEN** the fallow-skills plugin has not been installed on the machine
- **THEN** the `enabledPlugins` entry is inert and Claude Code operates normally without errors

#### Scenario: Skill can reach the CLI

- **WHEN** the fallow skill runs `npx fallow` inside a project
- **THEN** it resolves the project-local devDependency if present, else falls back to the npm registry — independent of the global install

### Requirement: Fallow-skills marketplace is registered

The managed key set of `dot_claude/modify_settings.json.tmpl` SHALL include a `fallow-skills` entry in `extraKnownMarketplaces` with source `github` and repo `fallow-rs/fallow-skills`, with `autoUpdate` set to `true`.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` runs on a machine without Claude Code settings
- **THEN** the rendered `~/.claude/settings.json` contains `fallow-skills` in `extraKnownMarketplaces` pointing to `fallow-rs/fallow-skills`

#### Scenario: Marketplace auto-updates

- **WHEN** Claude Code checks for plugin updates
- **THEN** the fallow-skills marketplace is included in the auto-update cycle because `autoUpdate` is `true`
