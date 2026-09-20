## ADDED Requirements

### Requirement: Daily Agentic Task Force marketplace and plugin are provisioned

The managed Claude Code plugin setup SHALL register the GitHub marketplace repository `pabloimrik17/daily-agentic-task-force` and install `datf-lab@daily-agentic-task-force` through the existing idempotent marketplace and plugin installation flow. The non-macOS setup guidance SHALL provide the corresponding marketplace-add and plugin-install commands because automatic package installation is not run there.

#### Scenario: Fresh macOS setup

- **WHEN** the install script runs with Claude Code available, the marketplace and plugin are absent, and the user confirms the Claude Code plugin dependencies group
- **THEN** it registers `pabloimrik17/daily-agentic-task-force` and installs `datf-lab@daily-agentic-task-force`

#### Scenario: Marketplace and plugin are already present

- **WHEN** the Claude Code pre-scan reports the repository and plugin ID as installed
- **THEN** the existing installer loops skip both operations and report them as already registered and installed

#### Scenario: Non-macOS setup

- **WHEN** the install script renders its non-macOS manual instructions
- **THEN** the output includes commands to add `pabloimrik17/daily-agentic-task-force` and install `datf-lab@daily-agentic-task-force`

### Requirement: DATF lab plugin is enabled by default

The managed Claude Code user settings SHALL include `"datf-lab@daily-agentic-task-force": true` in `enabledPlugins`. Applying the managed settings to an existing file SHALL preserve unrelated live settings under the existing Claude settings merge contract.

#### Scenario: Fresh Claude Code settings

- **WHEN** chezmoi creates the Claude Code user settings
- **THEN** `enabledPlugins` contains `"datf-lab@daily-agentic-task-force": true`

#### Scenario: Existing Claude Code settings

- **WHEN** chezmoi applies the managed settings over a file containing unrelated unmanaged keys
- **THEN** the DATF lab plugin is enabled without removing those unmanaged keys

### Requirement: Daily Agentic Task Force marketplace updates automatically

The managed Claude Code user settings SHALL include a `daily-agentic-task-force` entry in `extraKnownMarketplaces` whose source is the GitHub repository `pabloimrik17/daily-agentic-task-force` and whose `autoUpdate` value is `true`. Automatic updates SHALL be configured at marketplace scope; no separate per-plugin update field or repository-local version pin SHALL be added.

#### Scenario: Marketplace registration is rendered

- **WHEN** chezmoi renders the managed Claude Code settings
- **THEN** `extraKnownMarketplaces.daily-agentic-task-force` points to `pabloimrik17/daily-agentic-task-force` with `autoUpdate` set to `true`

#### Scenario: Claude Code refreshes plugins after startup

- **WHEN** the upstream marketplace publishes a new `datf-lab` version and Claude Code performs its background marketplace refresh
- **THEN** the installed plugin participates in the update through the marketplace's `autoUpdate` setting

### Requirement: DATF lab remains scoped to its published Claude Code channel

The dotfiles SHALL NOT configure a DATF lab counterpart for Codex, OpenCode, or Junie while `pabloimrik17/daily-agentic-task-force` publishes only the Claude marketplace and `datf-lab` Claude plugin package. The agent-config parity table SHALL record the Claude Code distribution and explicitly populated gaps for the other three tools rather than inventing a package, runtime command, or unmanaged file copy.

#### Scenario: Agent configuration parity is inspected

- **WHEN** the managed agent configuration and parity table are reviewed after this change
- **THEN** Claude Code lists `datf-lab@daily-agentic-task-force`
- **AND** Codex, OpenCode, and Junie contain no DATF lab configuration and each has an explicit `none` entry with the upstream-distribution reason in the parity row

