## ADDED Requirements

### Requirement: Global agent skills are installed individually via run_once script

The install script (`run_once_install-packages.sh.tmpl`) SHALL include a dedicated group that installs individual global agent skills using `npx -y skills add <repo> --skill <name> -g -y`. The group MUST prompt for confirmation before installing. The group MUST check that `npx` is available before attempting installation.

#### Scenario: First run on clean machine with npx available

- **WHEN** `chezmoi apply` runs the install script, `npx` is available, and the user confirms the agent skills group
- **THEN** all ten skills are installed individually:
    - `vercel-labs/skills` → find-skills
    - `vercel-labs/agent-skills` → vercel-react-best-practices
    - `vercel-labs/agent-skills` → web-design-guidelines
    - `vercel-labs/agent-skills` → vercel-composition-patterns
    - `anthropics/skills` → frontend-design
    - `anthropics/skills` → skill-creator
    - `anthropics/skills` → pdf
    - `anthropics/skills` → pptx
    - `anthropics/skills` → docx
    - `anthropics/skills` → xlsx

#### Scenario: npx not available

- **WHEN** `npx` is not found on the system
- **THEN** the group is skipped with a warning message and the script continues to the next group

#### Scenario: User declines

- **WHEN** the user declines the confirmation prompt for agent skills
- **THEN** no skills are installed and the script continues to the next group

#### Scenario: Individual skill install fails

- **WHEN** one of the `npx skills add` commands fails (e.g., network error, repo unavailable)
- **THEN** the error is logged, the error counter is incremented, and the script continues with the remaining skills

### Requirement: Already-installed skills are skipped

The install group SHALL query `npx -y skills list -g --json` before installing and SHALL skip any skill whose name already appears in the JSON output.

#### Scenario: All skills already installed

- **WHEN** all ten skills are already present in `npx skills list -g --json` output
- **THEN** each skill is reported as already installed and no `skills add` commands are executed

#### Scenario: Partial installation

- **WHEN** some skills are installed and others are not
- **THEN** only the missing skills are installed; already-present skills are skipped with an info message

### Requirement: Skills installation does not modify chezmoi-managed files

The skills installation process SHALL NOT modify `~/.claude/settings.json` or any other file managed by chezmoi templates.

#### Scenario: settings.json remains unchanged after skills installation

- **WHEN** all skills are installed via the run_once script
- **THEN** `~/.claude/settings.json` has identical content to before the skills installation

### Requirement: Non-macOS platform displays manual instructions

The non-macOS section of the install script SHALL include instructions for installing agent skills via `npx -y skills add <repo> --skill <name> -g -y`.

#### Scenario: Non-macOS platform

- **WHEN** the install script runs on a non-macOS platform
- **THEN** manual instructions are displayed listing all ten individual skill install commands
