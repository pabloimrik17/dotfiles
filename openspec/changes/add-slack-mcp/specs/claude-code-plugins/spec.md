# Delta: claude-code-plugins

## ADDED Requirements

### Requirement: Slack plugin is installed via the install script

The install script (`run_onchange_install-packages.sh.tmpl`) SHALL include `slack@claude-plugins-official` in the `CC_PLUGINS` array, installed by the existing plugin loop (`claude plugin install`) with the same pre-scan skip-if-installed behaviour as every other entry. The `CC_MARKETPLACES` array SHALL NOT gain a new entry: `anthropics/claude-plugins-official` is already registered there.

The plugin supplies the Slack MCP server definition (`type: http`, `https://mcp.slack.com/mcp`, a pre-registered OAuth `clientId`, and a fixed OAuth callback port) plus the Slack agent skills. The install script SHALL NOT configure the Slack MCP server itself.

#### Scenario: Fresh machine setup

- **WHEN** the install script runs the Claude Code plugin dependencies group on a machine where the plugin is absent
- **AND** the user confirms the group
- **THEN** `slack@claude-plugins-official` SHALL be installed via the existing plugin loop

#### Scenario: Already installed

- **WHEN** `claude plugin list --json` already contains `slack@claude-plugins-official`
- **THEN** the installation SHALL be skipped with an "already installed" message

#### Scenario: No new marketplace is registered

- **WHEN** `run_onchange_install-packages.sh.tmpl` is inspected
- **THEN** `CC_MARKETPLACES` SHALL be unchanged by this change and SHALL still contain `anthropics/claude-plugins-official` exactly once

#### Scenario: Claude CLI not available

- **WHEN** `claude` is not on PATH during `chezmoi apply`
- **THEN** the whole plugin group — including the Slack plugin — SHALL be skipped with the existing warning

### Requirement: Slack plugin is enabled by default

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include `"slack@claude-plugins-official": true` in the `enabledPlugins` object. Auto-update is inherited from the existing `claude-plugins-official` entry in `extraKnownMarketplaces`; no per-plugin auto-update field is added.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` SHALL be created with `slack@claude-plugins-official` listed in `enabledPlugins`

#### Scenario: Existing settings updated

- **WHEN** `chezmoi apply` is run on a machine with an older version of the managed settings file
- **THEN** the file SHALL be updated to include the `slack@claude-plugins-official` entry alongside all other existing plugins

#### Scenario: Plugin not installed

- **WHEN** the Slack plugin has not been installed on the machine
- **THEN** the `enabledPlugins` entry SHALL be inert and Claude Code SHALL operate normally without errors

#### Scenario: Marketplace already configured

- **WHEN** the `claude-plugins-official` marketplace is already present in `extraKnownMarketplaces`
- **THEN** no additional marketplace entry SHALL be needed for the Slack plugin

### Requirement: Slack MCP connection is authenticated through the plugin's OAuth flow

Authentication for the Slack MCP server in Claude Code SHALL happen through the OAuth flow the plugin triggers (on first tool use or via `/mcp`), using the `clientId` the plugin ships. No token, client secret, or environment variable SHALL be required on the Claude Code side.

#### Scenario: First use prompts for OAuth

- **WHEN** a Slack MCP tool is invoked for the first time on a machine where the plugin is installed and enabled
- **THEN** Claude Code SHALL start the Slack OAuth flow in the browser and store the resulting credentials itself

#### Scenario: Connection status is inspectable

- **WHEN** the user runs `/mcp` after authenticating
- **THEN** the `slack` server SHALL be listed as connected and its tools SHALL be available

#### Scenario: Workspace has not approved the connector

- **WHEN** the Slack workspace administrator has not approved the Slack MCP connector
- **THEN** the OAuth flow SHALL fail, the `slack` server SHALL report as not connected, and no other MCP server or plugin SHALL be affected
