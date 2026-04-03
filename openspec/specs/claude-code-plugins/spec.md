# Capability: claude-code-plugins

## Purpose

Claude Code plugin configuration and installation managed by chezmoi -- plugin enablement in settings and CLI tool installation via setup scripts.

## Requirements

### Requirement: Plannotator plugin is enabled by default

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include `"plannotator@plannotator": true` in the `enabledPlugins` object.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `plannotator@plannotator` listed in `enabledPlugins`

#### Scenario: Existing settings updated

- **WHEN** `chezmoi apply` is run on a machine with an older version of the managed settings file
- **THEN** the file is updated to include the `plannotator@plannotator` entry alongside all other existing plugins

#### Scenario: Plugin not installed

- **WHEN** the Plannotator CLI and marketplace plugin have not been installed on the machine
- **THEN** the `enabledPlugins` entry is inert and Claude Code operates normally without errors

### Requirement: Plannotator CLI is installed via chezmoi run_once script

The install script (`run_once_install-packages.sh.tmpl`) SHALL include a dedicated group that installs the Plannotator CLI using `curl -fsSL https://plannotator.ai/install.sh | bash`. The group MUST prompt for confirmation before installing and MUST skip installation if the `plannotator` command is already available. The group SHALL be named "Claude Code plugin dependencies" and SHALL be separate from the agent skills group.

#### Scenario: First run on clean machine

- **WHEN** `chezmoi apply` runs the install script and the user confirms the Claude Code plugin dependencies group
- **THEN** the Plannotator CLI is installed via the official install script

#### Scenario: Already installed

- **WHEN** the `plannotator` command is already available on the machine
- **THEN** the install group skips installation and reports it as already installed

#### Scenario: User declines

- **WHEN** the user declines the confirmation prompt for Claude Code plugin dependencies
- **THEN** the Plannotator CLI is not installed and the script continues to the next group

#### Scenario: Non-macOS platform

- **WHEN** the install script runs on a non-macOS platform
- **THEN** manual installation instructions for plannotator are displayed, including the `curl -fsSL https://plannotator.ai/install.sh | bash` command

### Requirement: Expo consolidated plugin is enabled by default

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include `"expo@expo-plugins": true` in the `enabledPlugins` object.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `expo@expo-plugins` listed in `enabledPlugins`

#### Scenario: Existing settings updated

- **WHEN** `chezmoi apply` is run on a machine with an older version of the managed settings file
- **THEN** the file is updated to include `expo@expo-plugins` in `enabledPlugins`, and the deprecated entries `expo-app-design@expo-plugins`, `upgrading-expo@expo-plugins`, and `expo-deployment@expo-plugins` are no longer present

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

### Requirement: Code-simplifier plugin is enabled by default

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include `"code-simplifier@claude-plugins-official": true` in the `enabledPlugins` object.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `code-simplifier@claude-plugins-official` listed in `enabledPlugins`

#### Scenario: Marketplace already configured

- **WHEN** the `claude-plugins-official` marketplace is already present in `extraKnownMarketplaces`
- **THEN** no additional marketplace entry is needed for code-simplifier
