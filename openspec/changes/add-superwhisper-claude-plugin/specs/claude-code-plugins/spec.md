## ADDED Requirements

### Requirement: SuperWhisper plugin is enabled by default

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include `"superwhisper@superwhisper": true` in the `enabledPlugins` object.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `superwhisper@superwhisper` listed in `enabledPlugins`

#### Scenario: Existing settings updated

- **WHEN** `chezmoi apply` is run on a machine with an older version of the managed settings file
- **THEN** the file is updated to include the `superwhisper@superwhisper` entry alongside all other existing plugins

#### Scenario: SuperWhisper app not installed

- **WHEN** the SuperWhisper macOS app is not present on the machine
- **THEN** the `enabledPlugins` entry is inert and Claude Code operates normally without errors

### Requirement: SuperWhisper marketplace is registered

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include a `superwhisper` entry in `extraKnownMarketplaces` with source `github` and repo `superultrainc/superwhisper-claude-code`, with `autoUpdate` set to `true`.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `superwhisper` in `extraKnownMarketplaces` pointing to `superultrainc/superwhisper-claude-code`

#### Scenario: Marketplace auto-updates

- **WHEN** Claude Code checks for plugin updates
- **THEN** the SuperWhisper marketplace is included in the auto-update cycle because `autoUpdate` is `true`

### Requirement: SuperWhisper plugin and marketplace are registered in install script

The install script (`run_onchange_install-packages.sh.tmpl`) SHALL include `superultrainc/superwhisper-claude-code` in the `CC_MARKETPLACES` array and `superwhisper@superwhisper` in the `CC_PLUGINS` array of the Claude Code plugin dependencies group. Pre-scan via `claude plugin marketplace list --json` and `claude plugin list --json` SHALL skip the marketplace registration and plugin install respectively when they are already present.

#### Scenario: First run with Claude Code installed

- **WHEN** `chezmoi apply` runs the install script and the user confirms the Claude Code plugin dependencies group
- **THEN** the SuperWhisper marketplace is registered via `claude plugin marketplace add superultrainc/superwhisper-claude-code` and the plugin is installed via `claude plugin install superwhisper@superwhisper`

#### Scenario: Marketplace already registered

- **WHEN** `claude plugin marketplace list --json` output contains `superultrainc/superwhisper-claude-code`
- **THEN** the marketplace registration is skipped with an "already registered" message

#### Scenario: Plugin already installed

- **WHEN** `claude plugin list --json` output contains `superwhisper@superwhisper`
- **THEN** the plugin installation is skipped with an "already installed" message

#### Scenario: Claude Code not installed

- **WHEN** `claude` is not available on the machine
- **THEN** the Claude Code plugin dependencies group is skipped with a warning, including the SuperWhisper entries
