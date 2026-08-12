## MODIFIED Requirements

### Requirement: Beads marketplace is registered

The Claude Code settings SHALL include a `beads-marketplace` entry in `extraKnownMarketplaces` with source `github` and repo `gastownhall/beads`, with `autoUpdate` set to `true`.

Upstream renamed the organisation at v1.0.0. The previous value (`steveyegge/beads`) resolves only through a GitHub redirect. Claude Code keys its registry by the marketplace *name* read from the repository's own manifest, which is unchanged, so repointing the repo is an in-place correction rather than a re-registration.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `beads-marketplace` in `extraKnownMarketplaces` pointing to `gastownhall/beads`

#### Scenario: Marketplace auto-updates

- **WHEN** Claude Code checks for plugin updates
- **THEN** the beads marketplace is included in the auto-update cycle because `autoUpdate` is `true`

#### Scenario: Marketplace identity is unchanged by the repoint

- **WHEN** the repo value changes from the old organisation to `gastownhall/beads`
- **THEN** the registered marketplace SHALL remain the single entry named `beads-marketplace`
- **AND** the installed `beads@beads-marketplace` plugin SHALL NOT be orphaned or duplicated

### Requirement: Beads plugin and marketplace are registered in install script

The install script SHALL register the `beads-marketplace` marketplace (`gastownhall/beads`) and install the `beads@beads-marketplace` plugin in the Claude Code plugin dependencies group. Before registering a marketplace, the script SHALL check `claude plugin marketplace list --json` and skip if the marketplace repo is already registered. Before installing a plugin, the script SHALL check `claude plugin list --json` and skip if the plugin ID is already installed.

The already-registered check compares the raw repo string, so on the first run after the repoint the check will not match and the script will re-attempt registration. That attempt is harmless — the group's runner does not fail the apply — but the noise can be avoided by removing the marketplace once beforehand.

#### Scenario: First run with Claude Code installed

- **WHEN** `chezmoi apply` runs the install script and the user confirms the Claude Code plugin dependencies group
- **THEN** the beads marketplace is registered via `claude plugin marketplace add gastownhall/beads` and the beads plugin is installed via `claude plugin install beads@beads-marketplace`

#### Scenario: Claude Code not installed

- **WHEN** `claude` is not available on the machine
- **THEN** the Claude Code plugin dependencies group is skipped with a warning

#### Scenario: Marketplace already registered

- **WHEN** `claude plugin marketplace list --json` output contains the marketplace repo
- **THEN** the marketplace registration is skipped with an "already registered" message

#### Scenario: First apply after the organisation repoint

- **WHEN** the live registry still records the old organisation string and the install script runs
- **THEN** the registration is re-attempted
- **AND** the apply SHALL NOT fail as a result

#### Scenario: Plugin already installed

- **WHEN** `claude plugin list --json` output contains the plugin ID
- **THEN** the plugin installation is skipped with an "already installed" message

#### Scenario: All marketplaces and plugins already present

- **WHEN** every marketplace and every plugin in the group are already registered/installed
- **THEN** the script prints a summary ("CC marketplaces: N/N registered", "CC plugins: N/N installed") and skips the group without prompting
