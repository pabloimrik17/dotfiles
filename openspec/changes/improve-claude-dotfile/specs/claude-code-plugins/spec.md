## ADDED Requirements

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

The install script (`run_once_install-packages.sh.tmpl`) SHALL include a dedicated group that installs the Plannotator CLI using `curl -fsSL https://plannotator.ai/install.sh | bash`. The group MUST prompt for confirmation before installing and MUST skip installation if the `plannotator` command is already available.

#### Scenario: First run on clean machine

- **WHEN** `chezmoi apply` runs the install script and the user confirms the Claude Code plugin dependencies group
- **THEN** the Plannotator CLI is installed via the official install script

#### Scenario: Already installed

- **WHEN** the `plannotator` command is already available on the machine
- **THEN** the install group skips installation and reports it as already installed

#### Scenario: User declines

- **WHEN** the user declines the confirmation prompt for Claude Code plugin dependencies
- **THEN** the Plannotator CLI is not installed and the script continues to the next group
