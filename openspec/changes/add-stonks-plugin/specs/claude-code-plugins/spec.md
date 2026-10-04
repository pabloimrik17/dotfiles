## ADDED Requirements

### Requirement: Stonks plugin is provisioned

The managed Claude Code plugin setup SHALL install `stonks@daily-agentic-task-force` through the existing idempotent plugin installation flow, reusing the `pabloimrik17/daily-agentic-task-force` marketplace registration already in that flow. The marketplace SHALL remain registered once. The non-macOS setup guidance SHALL provide the corresponding marketplace-add and plugin-install command. This change SHALL be merged only after the plugin is published in that marketplace.

#### Scenario: Fresh macOS setup

- **WHEN** the install script runs with Claude Code available, the plugin is absent, and the user confirms the Claude Code plugin dependencies group
- **THEN** it installs `stonks@daily-agentic-task-force`

#### Scenario: Plugin already installed

- **WHEN** the Claude Code pre-scan reports `stonks@daily-agentic-task-force` as installed
- **THEN** the plugin loop skips it and reports it as already installed

#### Scenario: Marketplace list is inspected

- **WHEN** the rendered install script's marketplace list is read
- **THEN** `pabloimrik17/daily-agentic-task-force` appears exactly once

#### Scenario: Non-macOS setup

- **WHEN** the install script renders its non-macOS manual instructions
- **THEN** the output includes a command that adds `pabloimrik17/daily-agentic-task-force` and installs `stonks@daily-agentic-task-force`

### Requirement: Stonks plugin is enabled by default

The managed Claude Code user settings SHALL include `"stonks@daily-agentic-task-force": true` in `enabledPlugins`. Applying the managed settings to an existing file SHALL preserve unrelated live settings under the existing Claude settings merge contract.

#### Scenario: Fresh Claude Code settings

- **WHEN** chezmoi creates the Claude Code user settings
- **THEN** `enabledPlugins` contains `"stonks@daily-agentic-task-force": true`

#### Scenario: Existing Claude Code settings

- **WHEN** chezmoi applies the managed settings over a file containing unrelated unmanaged keys
- **THEN** the stonks plugin is enabled without removing those unmanaged keys

### Requirement: Stonks plugin updates through the DATF marketplace

The existing `daily-agentic-task-force` entry in `extraKnownMarketplaces`, with `autoUpdate: true`, SHALL be the only update path for `stonks@daily-agentic-task-force`. The dotfiles SHALL NOT add a second marketplace entry, a per-plugin update field, a repository-local version pin, or an `update-extra` step for it.

#### Scenario: Upstream publishes a new version

- **WHEN** the upstream marketplace publishes a new `stonks` version and Claude Code performs its background marketplace refresh
- **THEN** the installed plugin participates in the update through the marketplace's `autoUpdate` setting

#### Scenario: Managed configuration is inspected

- **WHEN** the managed settings, install script, and update commands are searched for `stonks`
- **THEN** the only matches are the `enabledPlugins` entry, the `CC_PLUGINS` entry, and the non-macOS guidance line

### Requirement: Stonks plugin remains scoped to its published Claude Code channel

The dotfiles SHALL NOT configure a `stonks` counterpart for Codex, OpenCode, or Junie while `pabloimrik17/daily-agentic-task-force` publishes it only as a Claude Code plugin. The agent-config parity table SHALL list `stonks@daily-agentic-task-force` under Claude Code in the Daily Agentic Task Force row and keep explicit `none` gaps for the other three tools.

#### Scenario: Agent configuration parity is inspected

- **WHEN** the managed agent configuration and parity table are reviewed after this change
- **THEN** the Daily Agentic Task Force row lists `stonks@daily-agentic-task-force` under Claude Code
- **AND** Codex, OpenCode, and Junie contain no `stonks` configuration and keep their `none` entries with the upstream-distribution reason

### Requirement: Stonks runtime prerequisites are provisioned outside this change

Enabling the stonks plugin SHALL NOT depend on, and this change SHALL NOT provision, the plugin's runtime prerequisites: its encrypted configuration file, the `gws` CLI, the `ibkr` MCP server, or the permission deny for it. The manual SHALL document `/stonks:sync` and name those prerequisites and the dotfiles changes that provide them.

#### Scenario: Apply on a machine without the sibling tooling

- **WHEN** chezmoi applies the dotfiles on a machine where `gws`, the `ibkr` MCP server, and the stonks config file are not yet provisioned
- **THEN** `stonks@daily-agentic-task-force` is still installed and enabled
- **AND** this change's diff contains no `gws` package, MCP registration, permission rule, or config file

#### Scenario: Manual is inspected

- **WHEN** the manual's Claude Code section is read
- **THEN** it documents `/stonks:sync` with its `--only sources` and `--only watchlist` modes and lists its runtime prerequisites
