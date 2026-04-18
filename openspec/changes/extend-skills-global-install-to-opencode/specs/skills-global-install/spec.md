## MODIFIED Requirements

### Requirement: Global agent skills are installed individually via run_once script

The install script (`run_onchange_install-packages.sh.tmpl`) SHALL include a dedicated group that installs individual global agent skills using `npx -y skills add <repo> --skill <name> -g -y`. The group MUST prompt for confirmation before installing. The group MUST check that `npx` is available before attempting installation.

#### Scenario: First run on clean machine with npx available

- **WHEN** `chezmoi apply` runs the install script, `npx` is available, and the user confirms the agent skills group
- **THEN** all eleven skills are installed individually:
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
    - `slidevjs/slidev` → slidev

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

- **WHEN** all eleven skills are already present in `npx skills list -g --json` output
- **THEN** each skill is reported as already installed and no `skills add` commands are executed

#### Scenario: Partial installation

- **WHEN** some skills are installed and others are not
- **THEN** only the missing skills are installed; already-present skills are skipped with an info message

### Requirement: Non-macOS platform displays manual instructions

The non-macOS section of the install script SHALL include instructions for installing agent skills via `npx -y skills add <repo> --skill <name> -g -y` and for symlinking each installed skill from `~/.claude/skills/<name>` to `~/.config/opencode/skills/<name>`.

#### Scenario: Non-macOS platform

- **WHEN** the install script runs on a non-macOS platform
- **THEN** manual instructions are displayed listing all eleven individual skill install commands AND the equivalent `ln -sf` commands to expose each skill to OpenCode

## ADDED Requirements

### Requirement: Global skills are exposed to OpenCode via symlink

After each successful `npx skills add` invocation, the install group SHALL create a symlink at `~/.config/opencode/skills/<name>` pointing to `~/.claude/skills/<name>`, so that OpenCode discovers the same global skills that Claude Code has access to. The symlink SHALL be created using `ln -sf` so that re-running the script overwrites stale symlinks and retrofits skills that were already installed before this requirement existed. The parent directory `~/.config/opencode/skills/` SHALL be created with `mkdir -p` if it does not exist.

#### Scenario: Skill installed for the first time

- **WHEN** `install_skill slidevjs/slidev slidev` runs successfully on a machine without a previous install
- **THEN** `~/.claude/skills/slidev/` is created by `skills.sh` AND `~/.config/opencode/skills/slidev` exists as a symlink pointing to `~/.claude/skills/slidev`

#### Scenario: Skill already installed before this requirement existed

- **WHEN** `~/.claude/skills/pdf/` exists from a previous machine setup but `~/.config/opencode/skills/pdf` does not
- **THEN** the install group creates the missing symlink `~/.config/opencode/skills/pdf` → `~/.claude/skills/pdf` during the idempotent re-run

#### Scenario: Stale symlink is refreshed

- **WHEN** `~/.config/opencode/skills/docx` exists as a broken or outdated symlink
- **THEN** `ln -sf` replaces it with a fresh symlink pointing to `~/.claude/skills/docx`

#### Scenario: Skill install failed — symlink is not created

- **WHEN** `npx skills add` fails for skill `foo` (e.g., network error)
- **THEN** `~/.config/opencode/skills/foo` is NOT created or modified and the error is reported
