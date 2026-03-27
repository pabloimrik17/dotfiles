## MODIFIED Requirements

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
