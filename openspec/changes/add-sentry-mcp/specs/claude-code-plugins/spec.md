# Delta: claude-code-plugins

## ADDED Requirements

### Requirement: Sentry MCP marketplace is registered

The install script (`run_onchange_install-packages.sh.tmpl`) SHALL include `getsentry/sentry-mcp` in the `CC_MARKETPLACES` array, and the Claude Code settings source (`dot_claude/modify_settings.json.tmpl`) SHALL include a `sentry-mcp` entry in `extraKnownMarketplaces` with source `github` and repo `getsentry/sentry-mcp`, with `autoUpdate` set to `true`. Registration SHALL go through the group's existing loop (`marketplace_installed` pre-scan guard, then `run_claude_step "marketplace $repo" claude plugin marketplace add "$repo"`).

#### Scenario: Fresh machine setup

- **WHEN** the install script runs the Claude Code plugin dependencies group on a machine where the marketplace is not registered
- **AND** the user confirms the group prompt
- **THEN** `claude plugin marketplace add getsentry/sentry-mcp` SHALL run via `run_claude_step`
- **AND** `claude plugin marketplace list` SHALL afterwards report a `sentry-mcp` marketplace

#### Scenario: Marketplace already registered

- **WHEN** the pre-scan finds `getsentry/sentry-mcp` in the output of `claude plugin marketplace list --json`
- **THEN** the script SHALL print an "already registered, skipping" message and SHALL NOT re-add it

#### Scenario: Claude CLI not available

- **WHEN** `claude` is not in PATH during `chezmoi apply`
- **THEN** the whole Claude Code plugin dependencies group SHALL be skipped with a warning
- **AND** no Sentry-specific error SHALL be raised

#### Scenario: Marketplace stays current automatically

- **WHEN** Claude Code performs its marketplace auto-update cycle
- **THEN** the `sentry-mcp` marketplace SHALL be included because its `extraKnownMarketplaces` entry sets `autoUpdate` to `true`
- **AND** no version pin SHALL be required anywhere for the plugin

### Requirement: Sentry MCP plugin is installed and enabled by default

The install script SHALL include `sentry-mcp@sentry-mcp` in the `CC_PLUGINS` array, installed through the group's existing loop (`plugin_installed` pre-scan guard, then `run_claude_step "plugin $plugin" claude plugin install "$plugin"`). The Claude Code settings dotfile SHALL include `"sentry-mcp@sentry-mcp": true` in the `enabledPlugins` object.

The plugin is the sole provider of the Sentry MCP server in Claude Code: it ships its own `.mcp.json` declaring a `sentry` server over `https://mcp.sentry.dev/mcp`, which Claude Code exposes namespaced as `plugin:sentry-mcp:sentry`.

#### Scenario: Fresh machine setup

- **WHEN** the install script runs the Claude Code plugin dependencies group on a machine without the plugin
- **AND** the user confirms the group prompt
- **THEN** `claude plugin install sentry-mcp@sentry-mcp` SHALL run via `run_claude_step`
- **AND** `claude plugin list` SHALL afterwards include `sentry-mcp@sentry-mcp`

#### Scenario: Plugin already installed

- **WHEN** the pre-scan finds `sentry-mcp@sentry-mcp` in the output of `claude plugin list --json`
- **THEN** the script SHALL print an "already installed, skipping" message and SHALL NOT reinstall it

#### Scenario: Plugin not installed yet

- **WHEN** `chezmoi apply` writes `enabledPlugins` on a machine where the plugin has not been downloaded
- **THEN** the `"sentry-mcp@sentry-mcp": true` entry SHALL be inert and Claude Code SHALL operate normally without errors

#### Scenario: Plugin provides the Sentry MCP server

- **WHEN** the plugin is installed and enabled and the user runs `/mcp` inside a Claude Code session
- **THEN** a server named `plugin:sentry-mcp:sentry` SHALL be listed
- **AND** its tools SHALL be exposed under the `mcp__plugin_sentry-mcp_sentry__` prefix
- **AND** the server SHALL require OAuth sign-in on first use

#### Scenario: Plugin provides the Sentry subagent

- **WHEN** the plugin is installed and enabled
- **THEN** a `sentry-mcp` subagent SHALL be available for delegating Sentry queries
- **AND** the subagent SHALL resolve its `sentry` MCP server from the plugin's own `.mcp.json`

### Requirement: Non-macOS fallback documents the Sentry plugin

On a non-macOS machine the install script prints manual instructions instead of installing. The "Claude Code plugins" section of that fallback SHALL name the Sentry marketplace and plugin commands alongside the plannotator and worktrunk entries it already lists.

#### Scenario: Non-macOS machine prints Sentry plugin commands

- **WHEN** `chezmoi apply` runs the install script on a machine where `.chezmoi.os` is not `darwin`
- **THEN** the "Claude Code plugins" section SHALL print `claude plugin marketplace add getsentry/sentry-mcp && claude plugin install sentry-mcp@sentry-mcp`

#### Scenario: macOS machine does not print the fallback

- **WHEN** `chezmoi apply` runs the install script on macOS
- **THEN** the non-macOS fallback SHALL NOT be rendered
- **AND** the Sentry marketplace and plugin SHALL be installed by the plugin dependencies group instead
