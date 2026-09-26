## ADDED Requirements

### Requirement: Autonomous plugin is provisioned

The managed Claude Code plugin setup SHALL install `autonomous@daily-agentic-task-force` through the existing idempotent plugin installation flow, reusing the `pabloimrik17/daily-agentic-task-force` marketplace registration already in that flow. The marketplace SHALL remain registered once. The non-macOS setup guidance SHALL provide the corresponding marketplace-add and plugin-install command.

#### Scenario: Fresh macOS setup

- **WHEN** the install script runs with Claude Code available, the plugin is absent, and the user confirms the Claude Code plugin dependencies group
- **THEN** it installs `autonomous@daily-agentic-task-force`

#### Scenario: Plugin already installed

- **WHEN** the Claude Code pre-scan reports `autonomous@daily-agentic-task-force` as installed
- **THEN** the plugin loop skips it and reports it as already installed

#### Scenario: Marketplace list is inspected

- **WHEN** the rendered install script's marketplace list is read
- **THEN** `pabloimrik17/daily-agentic-task-force` appears exactly once

#### Scenario: Non-macOS setup

- **WHEN** the install script renders its non-macOS manual instructions
- **THEN** the output includes a command that adds `pabloimrik17/daily-agentic-task-force` and installs `autonomous@daily-agentic-task-force`

### Requirement: Autonomous plugin is enabled by default

The managed Claude Code user settings SHALL include `"autonomous@daily-agentic-task-force": true` in `enabledPlugins`. Applying the managed settings to an existing file SHALL preserve unrelated live settings under the existing Claude settings merge contract.

#### Scenario: Fresh Claude Code settings

- **WHEN** chezmoi creates the Claude Code user settings
- **THEN** `enabledPlugins` contains `"autonomous@daily-agentic-task-force": true`

#### Scenario: Existing Claude Code settings

- **WHEN** chezmoi applies the managed settings over a file containing unrelated unmanaged keys
- **THEN** the autonomous plugin is enabled without removing those unmanaged keys

### Requirement: Autonomous plugin updates through the DATF marketplace

The existing `daily-agentic-task-force` entry in `extraKnownMarketplaces`, with `autoUpdate: true`, SHALL be the only update path for `autonomous@daily-agentic-task-force`. The dotfiles SHALL NOT add a second marketplace entry, a per-plugin update field, a repository-local version pin, or an `update-extra` step for it.

#### Scenario: Upstream publishes a new version

- **WHEN** the upstream marketplace publishes a new `autonomous` version and Claude Code performs its background marketplace refresh
- **THEN** the installed plugin participates in the update through the marketplace's `autoUpdate` setting

#### Scenario: Managed configuration is inspected

- **WHEN** the managed settings, install script, and update commands are searched for `autonomous`
- **THEN** the only matches are the `enabledPlugins` entry, the `CC_PLUGINS` entry, and the non-macOS guidance line

### Requirement: Autonomous plugin remains scoped to its published Claude Code channel

The dotfiles SHALL NOT configure an `autonomous` counterpart for Codex, OpenCode, or Junie while `pabloimrik17/daily-agentic-task-force` publishes it only as a Claude Code plugin. The agent-config parity table SHALL list `autonomous@daily-agentic-task-force` under Claude Code in the Daily Agentic Task Force row and keep explicit `none` gaps for the other three tools.

#### Scenario: Agent configuration parity is inspected

- **WHEN** the managed agent configuration and parity table are reviewed after this change
- **THEN** the Daily Agentic Task Force row lists `autonomous@daily-agentic-task-force` under Claude Code
- **AND** Codex, OpenCode, and Junie contain no `autonomous` configuration and keep their `none` entries with the upstream-distribution reason

### Requirement: OpenUsage remains a manual prerequisite of the autonomous plugin

The dotfiles SHALL NOT install OpenUsage or add its CLI to `PATH` for the autonomous plugin. The manual SHALL list `bun` and the `openusage` CLI as the plugin's runtime requirements and state that `openusage` is installed manually.

#### Scenario: Apply on a machine without OpenUsage

- **WHEN** chezmoi applies the dotfiles on a machine where OpenUsage is not installed
- **THEN** no OpenUsage cask is installed and no shell file adds an OpenUsage path
- **AND** `autonomous@daily-agentic-task-force` is still installed and enabled

#### Scenario: Manual is inspected

- **WHEN** the manual's Claude Code section is read
- **THEN** it lists `bun` and the `openusage` CLI as requirements of `/autonomous:run` and says `openusage` is installed manually
