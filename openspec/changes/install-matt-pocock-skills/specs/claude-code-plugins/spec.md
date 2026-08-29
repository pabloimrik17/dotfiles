## ADDED Requirements

### Requirement: Matt Pocock skills plugin installed

The system SHALL install the `mattpocock-skills` plugin from `claude-plugins-official` through the managed Claude Code plugin installer.

#### Scenario: Plugin is not yet installed
- **WHEN** the package installer runs on macOS with Claude Code available and `mattpocock-skills@claude-plugins-official` absent
- **THEN** it installs `mattpocock-skills@claude-plugins-official`

#### Scenario: Plugin is already installed
- **WHEN** the package installer runs and `mattpocock-skills@claude-plugins-official` is already installed
- **THEN** it skips reinstallation

#### Scenario: Claude Code is unavailable
- **WHEN** the package installer runs and the Claude Code CLI is unavailable
- **THEN** it skips plugin installation without preventing later package groups from running

#### Scenario: Automatic plugin installation is unavailable
- **WHEN** the package installer renders its non-macOS manual instructions
- **THEN** the output includes the command to install `mattpocock-skills@claude-plugins-official`

### Requirement: Matt Pocock skills plugin enabled by default

The managed Claude Code settings SHALL enable `mattpocock-skills@claude-plugins-official` while preserving the existing `claude-plugins-official` marketplace registration and its automatic-update setting.

#### Scenario: Settings are rendered for a fresh configuration
- **WHEN** the managed Claude Code settings are rendered
- **THEN** `enabledPlugins` contains `"mattpocock-skills@claude-plugins-official": true`

#### Scenario: Settings are merged into an existing configuration
- **WHEN** managed settings are applied to a Claude Code configuration with unrelated existing settings
- **THEN** the Matt Pocock plugin is enabled without removing those unrelated settings

#### Scenario: Official marketplace configuration is inspected
- **WHEN** the managed settings are rendered after this change
- **THEN** the existing `claude-plugins-official` registration still has `autoUpdate` enabled
- **AND** no duplicate marketplace registration is added

### Requirement: Claude Code uses the namespaced plugin distribution

Claude Code SHALL receive Matt Pocock's complete 25-skill collection through the plugin distribution and SHALL NOT be targeted by the managed Matt Pocock skills.sh installation.

#### Scenario: Plugin skills are available
- **WHEN** the installed plugin is active in Claude Code
- **THEN** its skills are available under the `mattpocock-skills` plugin namespace
- **AND** the collection includes the namespaced `code-review` skill

#### Scenario: Distribution channels are inspected
- **WHEN** the managed plugin and skills.sh configuration are inspected together
- **THEN** Claude Code is configured for the plugin channel only
- **AND** OpenCode and Junie are configured for the standalone channel only
