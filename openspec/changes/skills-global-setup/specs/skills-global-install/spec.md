## ADDED Requirements

### Requirement: Global agent skills are installed via run_once script

The install script (`run_once_install-packages.sh.tmpl`) SHALL include a dedicated group that installs global agent skills using `npx -y skills add -g -y <repo>` for each configured skill repository. The group MUST prompt for confirmation before installing. The group MUST check that `npx` is available before attempting installation.

#### Scenario: First run on clean machine with npx available

- **WHEN** `chezmoi apply` runs the install script, `npx` is available, and the user confirms the agent skills group
- **THEN** all six skill repos are installed globally via `npx -y skills add -g -y`:
    - `vercel-labs/agent-skills`
    - `vercel-labs/skills`
    - `anthropics/skills`
    - `vercel-labs/next-skills`
    - `shadcn/ui`
    - `denoland/skills`

#### Scenario: Skills already installed

- **WHEN** the skills have already been installed from a previous run
- **THEN** the CLI re-runs safely (idempotent) and overwrites existing symlinks without error

#### Scenario: npx not available

- **WHEN** `npx` is not found on the system
- **THEN** the group is skipped with a warning message and the script continues to the next group

#### Scenario: User declines

- **WHEN** the user declines the confirmation prompt for agent skills
- **THEN** no skills are installed and the script continues to the next group

#### Scenario: Individual skill repo fails

- **WHEN** one of the `npx skills add` commands fails (e.g., network error, repo unavailable)
- **THEN** the error is logged, the error counter is incremented, and the script continues with the remaining repos

### Requirement: Skills installation does not modify chezmoi-managed files

The skills installation process SHALL NOT modify `~/.claude/settings.json` or any other file managed by chezmoi templates.

#### Scenario: settings.json remains unchanged after skills installation

- **WHEN** all skills are installed via the run_once script
- **THEN** `~/.claude/settings.json` has identical content to before the skills installation

### Requirement: Non-macOS platform displays manual instructions

The non-macOS section of the install script SHALL include instructions for installing agent skills via `npx -y skills add -g -y`.

#### Scenario: Non-macOS platform

- **WHEN** the install script runs on a non-macOS platform
- **THEN** manual instructions are displayed showing the `npx -y skills add -g -y <repo>` commands for all six repos
