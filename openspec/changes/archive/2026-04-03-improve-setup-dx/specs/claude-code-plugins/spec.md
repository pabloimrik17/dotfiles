## MODIFIED Requirements

### Requirement: Beads plugin and marketplace are registered in install script

The install script (`run_onchange_install-packages.sh.tmpl`) SHALL register the `beads-marketplace` marketplace (`steveyegge/beads`) and install the `beads@beads-marketplace` plugin in the Claude Code plugin dependencies group. Before registering a marketplace, the script SHALL check `claude plugin marketplace list --json` and skip if the marketplace repo is already registered. Before installing a plugin, the script SHALL check `claude plugin list --json` and skip if the plugin ID is already installed.

#### Scenario: First run with Claude Code installed

- **WHEN** `chezmoi apply` runs the install script and the user confirms the Claude Code plugin dependencies group
- **THEN** the beads marketplace is registered via `claude plugin marketplace add steveyegge/beads` and the beads plugin is installed via `claude plugin install beads@beads-marketplace`

#### Scenario: Claude Code not installed

- **WHEN** `claude` is not available on the machine
- **THEN** the Claude Code plugin dependencies group is skipped with a warning

#### Scenario: Marketplace already registered

- **WHEN** `claude plugin marketplace list --json` output contains the marketplace repo
- **THEN** the marketplace registration is skipped with an "already registered" message

#### Scenario: Plugin already installed

- **WHEN** `claude plugin list --json` output contains the plugin ID
- **THEN** the plugin installation is skipped with an "already installed" message

#### Scenario: All marketplaces and plugins already present

- **WHEN** every marketplace and every plugin in the group are already registered/installed
- **THEN** the script prints a summary ("CC marketplaces: N/N registered", "CC plugins: N/N installed") and skips the group without prompting
