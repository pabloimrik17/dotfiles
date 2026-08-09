# Delta: claude-code-plugins

## ADDED Requirements

### Requirement: PostHog plugin is installed via the install script

The install script (`run_onchange_install-packages.sh.tmpl`) SHALL include `posthog@claude-plugins-official` in the `CC_PLUGINS` array of the "Claude Code plugin dependencies" group, installed through the existing plugin loop (`claude plugin install posthog@claude-plugins-official`) with the same pre-scan skip-if-installed behavior as every other entry.

The `CC_MARKETPLACES` array SHALL NOT gain a new entry: the plugin is published in the official Anthropic marketplace (`anthropics/claude-plugins-official`), which the array already registers. The plugin id is exactly `posthog@claude-plugins-official` — plugin name `posthog` in that marketplace manifest, sourced from `https://github.com/PostHog/ai-plugin.git` and pinned by commit sha.

#### Scenario: First run with Claude Code installed

- **WHEN** `chezmoi apply` runs the install script and the user confirms the Claude Code plugin dependencies group
- **THEN** the PostHog plugin is installed via `claude plugin install posthog@claude-plugins-official`
- **AND** no new marketplace is registered for it

#### Scenario: Plugin already installed

- **WHEN** `claude plugin list --json` output already contains `posthog@claude-plugins-official`
- **THEN** the plugin installation is skipped with an "already installed" message
- **AND** a second consecutive `chezmoi apply` produces no further plugin installs

#### Scenario: Claude Code not installed

- **WHEN** `claude` is not available on the machine
- **THEN** the Claude Code plugin dependencies group is skipped with a warning and the PostHog plugin is not installed

### Requirement: PostHog plugin is enabled by default

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include `"posthog@claude-plugins-official": true` in the `enabledPlugins` object, placed in alphabetical order between `plugin-dev@claude-plugins-official` and `skill-creator@claude-plugins-official`. Enabling the plugin activates both its PostHog slash commands (`/posthog:flags`, `/posthog:insights`, `/posthog:errors`, `/posthog:experiments`) and the MCP server it bundles.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `posthog@claude-plugins-official` listed in `enabledPlugins`

#### Scenario: Existing settings updated

- **WHEN** `chezmoi apply` is run on a machine with an older version of the managed settings file
- **THEN** the file is updated to include the `posthog@claude-plugins-official` entry alongside all other existing plugins

#### Scenario: Plugin not installed

- **WHEN** the PostHog plugin has not been installed on the machine
- **THEN** the `enabledPlugins` entry is inert and Claude Code operates normally without errors

#### Scenario: Marketplace already configured

- **WHEN** the `claude-plugins-official` marketplace is already present in `extraKnownMarketplaces`
- **THEN** no additional marketplace entry is needed for PostHog
- **AND** plugin updates are picked up through that marketplace entry's `autoUpdate: true`
