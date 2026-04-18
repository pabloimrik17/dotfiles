## ADDED Requirements

### Requirement: Slidev skill is installed globally via skills.sh

The install script (`run_onchange_install-packages.sh.tmpl`) SHALL install the `slidev` skill from the `slidevjs/slidev` repository during the existing agent-skills installation group, using the same `install_skill <repo> <name>` helper shape as the other skills in that group. The executed command MUST include the `-g` global flag and be placed inside the group's confirmation-gated block so it shares the single user prompt with the other global skills.

#### Scenario: First run on clean machine with npx available and user confirms

- **WHEN** `chezmoi apply` runs the install script, `npx` is available, and the user confirms the agent-skills group
- **THEN** the script executes `npx -y skills add slidevjs/slidev --skill slidev -g -y`
- **AND** a symlink is created at `~/.claude/skills/slidev` pointing to `../../.agents/skills/slidev` (same layout as the other skills in the group)
- **AND** no prompt or additional confirmation is requested beyond the group-level one

#### Scenario: User declines the agent-skills group

- **WHEN** the user declines the confirmation prompt that gates the agent-skills group
- **THEN** the Slidev skill is not installed
- **AND** no `npx -y skills add slidevjs/slidev …` command is executed

#### Scenario: npx is not available

- **WHEN** `npx` is not found on the system during script execution
- **THEN** the Slidev install is skipped together with the rest of the agent-skills group
- **AND** a warning is logged
- **AND** the script continues to subsequent groups

### Requirement: Slidev install is idempotent via the shared skills-list cache

The Slidev install step SHALL consult the same `npx -y skills list -g --json` result that the agent-skills group already caches, and SHALL skip invocation when `slidev` is already present in that output.

#### Scenario: Slidev already installed

- **WHEN** the agent-skills group runs and `slidev` appears in the cached `skills list -g --json` output
- **THEN** `npx -y skills add slidevjs/slidev …` is NOT executed
- **AND** an info message indicates Slidev is already installed

#### Scenario: skills-list cache query fails

- **WHEN** the `npx -y skills list -g --json` cache query fails (e.g., network or runtime error)
- **THEN** the group proceeds without the skip-check, consistent with other skills in the same group
- **AND** the Slidev install is attempted; if it fails because the skill is already installed, the error counter is incremented and the script continues

### Requirement: Slidev install failures do not abort the script

A failure of the Slidev `skills add` invocation SHALL NOT stop execution of the remaining install steps. The error MUST be logged, the group-level error counter MUST be incremented, and subsequent skills and groups MUST continue.

#### Scenario: Slidev install fails mid-run

- **WHEN** the `npx -y skills add slidevjs/slidev --skill slidev -g -y` command exits non-zero
- **THEN** the failure is logged with the skill name
- **AND** the group-level error counter is incremented by 1
- **AND** the script continues with the next skill in the group and with later groups

### Requirement: Slidev install does not modify chezmoi-managed files

The Slidev install step SHALL NOT modify any file managed by chezmoi (notably `~/.claude/settings.json`). Only the `skills.sh`-owned directories (`~/.agents/skills/` and `~/.claude/skills/` symlinks) MAY change as a result of this step.

#### Scenario: settings.json is untouched after install

- **WHEN** the Slidev install step completes successfully
- **THEN** the content of `~/.claude/settings.json` is byte-identical to its content before the step ran

#### Scenario: No new files appear outside skills.sh-owned paths

- **WHEN** the Slidev install step completes
- **THEN** all newly created files or symlinks live under `~/.agents/skills/slidev/` or `~/.claude/skills/slidev`
- **AND** no other chezmoi-managed path is created or modified

### Requirement: Non-macOS manual instructions include Slidev

The non-macOS branch of the install script SHALL display the literal Slidev install command as part of its manual-instructions block so users on other platforms can install the skill by copy-paste.

#### Scenario: Script runs on a non-macOS platform

- **WHEN** the install script executes on a platform other than macOS
- **THEN** the displayed manual-instructions block includes the line `npx -y skills add slidevjs/slidev --skill slidev -g -y`
- **AND** the line appears alongside the existing skill install commands, not in a separate section

### Requirement: Slidev install is scoped to Claude Code only in this change

The Slidev install step introduced by this change SHALL result in the skill being available only to Claude Code on machines where `skills.sh`'s default agent resolution targets Claude Code (as observed on the user's machine). Extending availability to other agents (e.g., OpenCode) is out of scope and MUST be addressed by a separate change.

#### Scenario: Only Claude Code receives the skill

- **WHEN** the install step runs successfully on a machine that has both Claude Code and OpenCode configured and whose `skills.sh` default resolution targets only Claude Code
- **THEN** the `slidev` skill symlink appears under `~/.claude/skills/`
- **AND** no `slidev` symlink is created under `~/.config/opencode/skills/` or `~/.opencode/skills/` as a result of this change
