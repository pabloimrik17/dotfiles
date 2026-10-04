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

### Requirement: Retro skill remains an upstream prerequisite of the prompt-presets plugin

The dotfiles SHALL NOT install Matt Pocock's `retro` skill as a standalone Claude Code skill for `/prompt-presets:matt-retro`; Claude Code SHALL receive it only through `mattpocock-skills@claude-plugins-official`. The manual SHALL name that skill as the command's prerequisite.

#### Scenario: Plugin channel lacks the retro skill

- **WHEN** chezmoi applies the dotfiles while the installed `mattpocock-skills` plugin does not ship `retro`
- **THEN** no skills.sh operation targets `claude-code` with `retro`
- **AND** `prompt-presets@monolab` is still installed and enabled

#### Scenario: Manual is inspected

- **WHEN** the manual's Claude Code section is read
- **THEN** it lists `/prompt-presets:matt-retro` and names Matt Pocock's `retro` skill as its prerequisite
