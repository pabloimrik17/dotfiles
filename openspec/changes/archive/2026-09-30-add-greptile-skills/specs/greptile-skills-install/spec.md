# Capability: greptile-skills-install

## Purpose

Provision the Greptile agent skills (`greploop`, `check-pr`, `cli-review` from `greptileai/skills`) globally via `skills.sh` during chezmoi setup, so Claude Code, OpenCode, Junie, and Codex can drive Greptile PR-review loops on every machine. The install shares the agent-skills group's confirmation prompt, skills-list cache, and error counter.

## ADDED Requirements

### Requirement: Greptile skills are installed globally via skills.sh

The install script (`run_onchange_install-packages.sh.tmpl`) SHALL install the `greploop`, `check-pr`, and `cli-review` skills from `greptileai/skills` during the existing agent-skills group, each through the group's shared `install_skill <repo> <name> <agents>` helper. Each command MUST include the `-g` global flag, MUST explicitly target `claude-code`, `opencode`, `junie`, and `codex`, and MUST sit inside the group's confirmation-gated block.

#### Scenario: First run on clean machine with npx available and user confirms

- **WHEN** `chezmoi apply` runs the install script, `npx` is available, and the user confirms the agent-skills group
- **THEN** the script executes `npx -y skills add greptileai/skills --skill <name> -g -y --agent claude-code opencode junie codex` once for each of `greploop`, `check-pr`, and `cli-review`
- **AND** each payload is staged at `~/.agents/skills/<name>/`
- **AND** no confirmation is requested beyond the group-level one

#### Scenario: User declines the agent-skills group

- **WHEN** the user declines the agent-skills confirmation prompt
- **THEN** none of the three skills is installed
- **AND** no `npx -y skills add greptileai/skills …` command is executed

#### Scenario: npx is not available

- **WHEN** `npx` is not found
- **THEN** the Greptile installs are skipped with the rest of the group and a warning is logged
- **AND** the script continues to subsequent groups

### Requirement: Greptile skills are available to all four agents

The install step SHALL make each of the three skills discoverable by Claude Code, OpenCode, Junie, and Codex. The four agents are named explicitly rather than left to the CLI's default agent resolution.

#### Scenario: All four agents can discover each skill

- **WHEN** the install step completes on the user's machine
- **THEN** a symlink for each skill exists under `~/.claude/skills/` and `~/.junie/skills/`, pointing into `~/.agents/skills/`
- **AND** `npx -y skills list -g --json` reports each skill with `Claude Code`, `OpenCode`, `Junie`, and `Codex` in its `agents` list

### Requirement: Greptile skill installs are idempotent

Each install SHALL be skipped only when the skill is present in the cached `npx -y skills list -g --json` output AND every requested agent is in that entry's `agents` list. When any requested agent is missing, the step SHALL run `skills add` to reconcile coverage.

#### Scenario: Skill already installed with full coverage

- **WHEN** a skill appears in the cached output covering all four agents
- **THEN** its `skills add` command is NOT executed
- **AND** an info message reports it as already installed

#### Scenario: Skill installed with partial coverage

- **WHEN** a skill appears in the cached output but its `agents` list omits one of the four
- **THEN** the full `skills add` command with all four agent arguments is executed

### Requirement: Greptile skill install failures do not abort the script

A failing `skills add` for any of the three skills SHALL NOT stop the remaining install steps. The failure MUST be logged with the skill name and the group-level error counter incremented.

#### Scenario: One Greptile skill fails to install

- **WHEN** `skills add` for one of the three exits non-zero
- **THEN** the failure is logged with the skill name and the error counter is incremented by 1
- **AND** the other Greptile skills and later groups still run

### Requirement: Greptile skill install does not modify chezmoi-managed files

The install step SHALL NOT modify `~/.claude/settings.json` or any other chezmoi-managed file. Only `skills.sh`-owned locations (`~/.agents/skills/` and per-agent links into it) MAY change.

#### Scenario: Managed configs are untouched

- **WHEN** the Greptile skill installs complete
- **THEN** `~/.claude/settings.json` is byte-identical to its content before the step
- **AND** all new files or symlinks live under `~/.agents/skills/` or `skills.sh`-managed per-agent links

### Requirement: Non-macOS manual instructions include the Greptile skills

The non-macOS branch of the install script SHALL display the literal install command for each of the three skills, including agent selection, in the manual-instructions block, in the same order as the `install_skill` calls.

#### Scenario: Script runs on a non-macOS platform

- **WHEN** the install script runs on a platform other than macOS
- **THEN** the manual block includes `npx -y skills add greptileai/skills --skill greploop -g -y --agent claude-code opencode junie codex`, and the same line for `check-pr` and `cli-review`
- **AND** the lines sit alongside the other skill install commands, not in a separate section
