## ADDED Requirements

### Requirement: Prompt-presets plugin is provisioned

The managed Claude Code plugin setup SHALL install `prompt-presets@monolab` through the existing idempotent plugin installation flow, reusing the `pabloimrik17/monolab` marketplace registration already in that flow. The marketplace SHALL remain registered once. The non-macOS setup guidance SHALL provide the corresponding marketplace-add and plugin-install command.

#### Scenario: Fresh macOS setup

- **WHEN** the install script runs with Claude Code available, the plugin is absent, and the user confirms the Claude Code plugin dependencies group
- **THEN** it installs `prompt-presets@monolab`

#### Scenario: Plugin already installed

- **WHEN** the Claude Code pre-scan reports `prompt-presets@monolab` as installed
- **THEN** the plugin loop skips it and reports it as already installed

#### Scenario: Marketplace list is inspected

- **WHEN** the rendered install script's marketplace list is read
- **THEN** `pabloimrik17/monolab` appears exactly once

#### Scenario: Non-macOS setup

- **WHEN** the install script renders its non-macOS manual instructions
- **THEN** the output includes a command that adds `pabloimrik17/monolab` and installs `prompt-presets@monolab`

### Requirement: Prompt-presets plugin is enabled by default

The managed Claude Code user settings SHALL include `"prompt-presets@monolab": true` in `enabledPlugins`. Applying the managed settings to an existing file SHALL preserve unrelated live settings under the existing Claude settings merge contract.

#### Scenario: Fresh Claude Code settings

- **WHEN** chezmoi creates the Claude Code user settings
- **THEN** `enabledPlugins` contains `"prompt-presets@monolab": true`

#### Scenario: Existing Claude Code settings

- **WHEN** chezmoi applies the managed settings over a file containing unrelated unmanaged keys
- **THEN** the prompt-presets plugin is enabled without removing those unmanaged keys

#### Scenario: Plugin not installed

- **WHEN** `prompt-presets@monolab` has not been installed on the machine
- **THEN** the `enabledPlugins` entry is inert and Claude Code operates normally without errors

### Requirement: Prompt-presets plugin updates through the monolab marketplace

The existing `monolab` entry in `extraKnownMarketplaces`, with `autoUpdate: true` and no `ref`, SHALL be the only update path for `prompt-presets@monolab`. The dotfiles SHALL NOT add a second marketplace entry, a marketplace `ref`, a per-plugin update field, a repository-local version pin, or an `update-extra` step for it.

#### Scenario: Upstream publishes a new version

- **WHEN** the monolab default branch publishes a new `prompt-presets` version and Claude Code performs its background marketplace refresh
- **THEN** the installed plugin participates in the update through the marketplace's `autoUpdate` setting

#### Scenario: Managed configuration is inspected

- **WHEN** the managed settings, install script, and update commands are searched for `prompt-presets`
- **THEN** the only matches are the `enabledPlugins` entry, the `CC_PLUGINS` entry, and the non-macOS guidance line
- **AND** `extraKnownMarketplaces.monolab.source` carries no `ref`

### Requirement: Prompt-presets plugin remains scoped to its published Claude Code channel

The dotfiles SHALL NOT configure a `prompt-presets` counterpart for Codex, OpenCode, or Junie while `pabloimrik17/monolab` publishes it only as a Claude Code plugin. The agent-config parity table SHALL carry a row listing `prompt-presets@monolab` under Claude Code and explicit `none` gaps, with the upstream-distribution reason, for the other three tools.

#### Scenario: Agent configuration parity is inspected

- **WHEN** the managed agent configuration and parity table are reviewed after this change
- **THEN** the parity table lists `prompt-presets@monolab` under Claude Code
- **AND** Codex, OpenCode, and Junie contain no `prompt-presets` configuration and each has a `none` entry with the upstream-distribution reason

### Requirement: Retro skill reaches Claude Code through the Matt Pocock plugin

Claude Code SHALL receive Matt Pocock's `retro` skill only through `mattpocock-skills@mattpocock`; the dotfiles SHALL NOT install it as a standalone Claude Code skill. The manual SHALL name that skill as the prerequisite of `/prompt-presets:matt-retro`.

#### Scenario: Retro skill is available

- **WHEN** `mattpocock-skills@mattpocock` is installed and active in Claude Code
- **THEN** `mattpocock-skills:retro` is available
- **AND** no skills.sh operation targets `claude-code` with `retro`

#### Scenario: Manual is inspected

- **WHEN** the manual's Claude Code section is read
- **THEN** it lists `/prompt-presets:matt-retro` and names Matt Pocock's `retro` skill as its prerequisite

## MODIFIED Requirements

### Requirement: Matt Pocock skills plugin installed

The system SHALL install the `mattpocock-skills` plugin from Matt Pocock's `mattpocock` marketplace (`mattpocock/skills`) through the managed Claude Code plugin installer, SHALL NOT install it from `claude-plugins-official`, and SHALL uninstall an installed `mattpocock-skills@claude-plugins-official` only once `mattpocock-skills@mattpocock` is installed.

#### Scenario: Plugin is not yet installed

- **WHEN** the package installer runs on macOS with Claude Code available and `mattpocock-skills@mattpocock` absent
- **THEN** it registers `mattpocock/skills` once and installs `mattpocock-skills@mattpocock`

#### Scenario: Plugin is already installed

- **WHEN** the package installer runs and `mattpocock-skills@mattpocock` is already installed
- **THEN** it skips reinstallation

#### Scenario: Claude Code is unavailable

- **WHEN** the package installer runs and the Claude Code CLI is unavailable
- **THEN** it skips plugin installation without preventing later package groups from running

#### Scenario: Automatic plugin installation is unavailable

- **WHEN** the package installer renders its non-macOS manual instructions
- **THEN** the output includes the command that adds `mattpocock/skills` and installs `mattpocock-skills@mattpocock`

#### Scenario: Official copy is retired

- **WHEN** the confirmed plugin group runs with `mattpocock-skills@claude-plugins-official` installed and `mattpocock-skills@mattpocock` installed by the end of the group
- **THEN** it uninstalls `mattpocock-skills@claude-plugins-official`

#### Scenario: Replacement is not installed

- **WHEN** the plugin group is declined, or installing `mattpocock-skills@mattpocock` fails, with `mattpocock-skills@claude-plugins-official` installed
- **THEN** `mattpocock-skills@claude-plugins-official` stays installed and enabled

### Requirement: Matt Pocock skills plugin enabled by default

The managed Claude Code settings SHALL enable `mattpocock-skills@mattpocock`, register the `mattpocock` marketplace with automatic updates, and leave any `mattpocock-skills@claude-plugins-official` key unmanaged.

#### Scenario: Settings are rendered for a fresh configuration

- **WHEN** the managed Claude Code settings are rendered
- **THEN** `enabledPlugins` contains `"mattpocock-skills@mattpocock": true`
- **AND** `enabledPlugins` has no `mattpocock-skills@claude-plugins-official` key

#### Scenario: Settings are merged into an existing configuration

- **WHEN** managed settings are applied to a Claude Code configuration with unrelated existing settings and `"mattpocock-skills@claude-plugins-official": true`
- **THEN** `mattpocock-skills@mattpocock` is enabled
- **AND** the `mattpocock-skills@claude-plugins-official` key and the unrelated settings remain

#### Scenario: Official marketplace configuration is inspected

- **WHEN** the managed settings are rendered after this change
- **THEN** the existing `claude-plugins-official` registration still has `autoUpdate` enabled
- **AND** `extraKnownMarketplaces.mattpocock` points to `mattpocock/skills` with `autoUpdate` enabled and no `ref`
- **AND** no duplicate marketplace registration is added

### Requirement: Claude Code uses the namespaced plugin distribution

Claude Code SHALL receive Matt Pocock's complete plugin collection through the plugin distribution and SHALL NOT be targeted by the managed Matt Pocock skills.sh installation.

#### Scenario: Plugin skills are available

- **WHEN** the installed plugin is active in Claude Code
- **THEN** its skills are available under the `mattpocock-skills` plugin namespace
- **AND** the collection includes the namespaced `code-review` and `retro` skills

#### Scenario: Distribution channels are inspected

- **WHEN** the managed plugin and skills.sh configuration are inspected together
- **THEN** Claude Code receives Matt Pocock skills through the plugin channel only
- **AND** OpenCode and Junie receive Matt Pocock skills through the standalone channel only
