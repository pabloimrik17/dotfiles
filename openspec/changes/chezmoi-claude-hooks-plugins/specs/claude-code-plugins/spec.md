## ADDED Requirements

### Requirement: Beads plugin is enabled by default

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include `"beads@beads-marketplace": true` in the `enabledPlugins` object.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `beads@beads-marketplace` listed in `enabledPlugins`

#### Scenario: Plugin not installed

- **WHEN** the beads marketplace plugin has not been fetched yet on the machine
- **THEN** the `enabledPlugins` entry is inert and Claude Code operates normally without errors

### Requirement: Beads marketplace is registered

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include a `beads-marketplace` entry in `extraKnownMarketplaces` with source `github` and repo `steveyegge/beads`, with `autoUpdate` set to `true`.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `beads-marketplace` in `extraKnownMarketplaces` pointing to `steveyegge/beads`

#### Scenario: Marketplace auto-updates

- **WHEN** Claude Code checks for plugin updates
- **THEN** the beads marketplace is included in the auto-update cycle because `autoUpdate` is `true`

### Requirement: Beads plugin and marketplace are registered in install script

The install script (`run_once_install-packages.sh.tmpl`) SHALL register the `beads-marketplace` marketplace (`steveyegge/beads`) and install the `beads@beads-marketplace` plugin in the Claude Code plugin dependencies group.

#### Scenario: First run with Claude Code installed

- **WHEN** `chezmoi apply` runs the install script and the user confirms the Claude Code plugin dependencies group
- **THEN** the beads marketplace is registered via `claude plugin marketplace add steveyegge/beads` and the beads plugin is installed via `claude plugin install beads@beads-marketplace`

#### Scenario: Claude Code not installed

- **WHEN** `claude` is not available on the machine
- **THEN** the Claude Code plugin dependencies group is skipped with a warning

### Requirement: Code-simplifier plugin is enabled by default

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include `"code-simplifier@claude-plugins-official": true` in the `enabledPlugins` object.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `code-simplifier@claude-plugins-official` listed in `enabledPlugins`

#### Scenario: Marketplace already configured

- **WHEN** the `claude-plugins-official` marketplace is already present in `extraKnownMarketplaces`
- **THEN** no additional marketplace entry is needed for code-simplifier
