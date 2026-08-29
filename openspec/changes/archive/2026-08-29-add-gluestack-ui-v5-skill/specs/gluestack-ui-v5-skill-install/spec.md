## Purpose

Provision the official gluestack-ui v5 agent skill (`gluestack/agent-skills` → `gluestack-ui-v5`) globally via `skills.sh` during chezmoi setup, so Claude Code, OpenCode, Junie, and Codex gain gluestack v5 knowledge — component regeneration with the official CLI (`npx gluestack-ui add`) instead of hand-maintained vendored components — on every fresh machine. The install shares the existing agent-skills group's confirmation prompt, skills-list cache, and error counter.

## ADDED Requirements

### Requirement: gluestack-ui-v5 skill is installed globally via skills.sh

The install script (`run_onchange_install-packages.sh.tmpl`) SHALL install the `gluestack-ui-v5` skill from the `gluestack/agent-skills` repository during the existing agent-skills installation group, reusing the group's shared install helper and its error handling. The executed command MUST include the `-g` global flag, MUST explicitly target the agents `claude-code`, `opencode`, `junie`, and `codex`, and MUST be placed inside the group's confirmation-gated block so it shares the single user prompt with the other global skills.

#### Scenario: First run on clean machine with npx available and user confirms

- **WHEN** `chezmoi apply` runs the install script, `npx` is available, and the user confirms the agent-skills group
- **THEN** the script executes `npx -y skills add gluestack/agent-skills --skill gluestack-ui-v5 -g -y` with an agent selection covering `claude-code`, `opencode`, `junie`, and `codex`
- **AND** the skill payload is staged at `~/.agents/skills/gluestack-ui-v5/`
- **AND** no prompt or additional confirmation is requested beyond the group-level one

#### Scenario: User declines the agent-skills group

- **WHEN** the user declines the confirmation prompt that gates the agent-skills group
- **THEN** the gluestack-ui-v5 skill is not installed
- **AND** no `npx -y skills add gluestack/agent-skills …` command is executed

#### Scenario: npx is not available

- **WHEN** `npx` is not found on the system during script execution
- **THEN** the gluestack-ui-v5 install is skipped together with the rest of the agent-skills group
- **AND** a warning is logged
- **AND** the script continues to subsequent groups

### Requirement: gluestack-ui-v5 skill is available to Claude Code, OpenCode, Junie, and Codex

The install step SHALL make the `gluestack-ui-v5` skill discoverable by all four agents in use — Claude Code, OpenCode, Junie, and Codex — following the linking and shared-store resolution behavior of the current `skills.sh` CLI.

#### Scenario: All four agents can discover the skill after install

- **WHEN** the install step completes successfully on the user's machine
- **THEN** a `gluestack-ui-v5` symlink exists under `~/.claude/skills/` pointing into `~/.agents/skills/`
- **AND** a `gluestack-ui-v5` symlink exists under `~/.junie/skills/` pointing into `~/.agents/skills/`
- **AND** the `gluestack-ui-v5` skill is discoverable by OpenCode's user-level skill resolution
- **AND** `npx -y skills list -g --agent codex --json` reports `gluestack-ui-v5` as discoverable by Codex through the global store

#### Scenario: Agent selection arguments are explicit, not default-dependent

- **WHEN** the install command is executed on a machine where `skills.sh` default agent resolution differs (e.g., additional agents installed)
- **THEN** the command's explicit agent arguments still name exactly `claude-code`, `opencode`, `junie`, and `codex`
- **AND** coverage of these four agents does not depend on CLI default-resolution behavior
- **AND** any additional discovery through the shared global store does not replace or expand the command's declared agent arguments

### Requirement: gluestack-ui-v5 install is idempotent via the shared skills-list cache

The gluestack-ui-v5 install step SHALL consult the same `npx -y skills list -g --json` result that the agent-skills group already caches, and SHALL skip invocation only when `gluestack-ui-v5` is present in that output AND every requested agent target is already covered by that entry's `agents` list. When any requested target is missing, the step SHALL proceed with `skills add` so the declared coverage is reconciled rather than left drifted. Because `skills list --json` reports agents by display name while `--agent` takes slugs, the check MUST map slugs to display names (`claude-code` → `Claude Code`, `opencode` → `OpenCode`, `junie` → `Junie`, `codex` → `Codex`).

#### Scenario: gluestack-ui-v5 already installed with full agent coverage

- **WHEN** the agent-skills group runs and `gluestack-ui-v5` appears in the cached `skills list -g --json` output with `claude-code`, `opencode`, `junie`, and `codex` all covered
- **THEN** `npx -y skills add gluestack/agent-skills …` is NOT executed
- **AND** an info message indicates gluestack-ui-v5 is already installed

#### Scenario: cached skill is missing a requested agent target

- **WHEN** `gluestack-ui-v5` appears in the cached output but its `agents` list omits one or more of `claude-code`, `opencode`, `junie`, `codex`
- **THEN** the skip is NOT taken and `npx -y skills add gluestack/agent-skills --skill gluestack-ui-v5 -g -y --agent claude-code opencode junie codex` is executed
- **AND** the requested coverage is reconciled instead of remaining incomplete across reruns

#### Scenario: jq is unavailable for agent-coverage inspection

- **WHEN** `jq` is not available on PATH, so the cached entry's `agents` list cannot be inspected
- **THEN** the step falls back to a name-only presence check
- **AND** a skill already present by name is skipped, matching the group's prior behavior

#### Scenario: skills invoked without explicit agent targets are unaffected

- **WHEN** an `install_skill` call passes no agent list, as the other skills in the group do
- **THEN** the skip decision is made on skill-name presence alone
- **AND** the behavior is identical to before agent-coverage checking was introduced

#### Scenario: skills-list cache query fails

- **WHEN** the `npx -y skills list -g --json` cache query fails (e.g., network or runtime error)
- **THEN** the group proceeds without the skip-check, consistent with other skills in the same group
- **AND** the gluestack-ui-v5 install is attempted; if it fails because the skill is already installed, the error counter is incremented and the script continues

### Requirement: gluestack-ui-v5 install failures do not abort the script

A failure of the gluestack-ui-v5 `skills add` invocation SHALL NOT stop execution of the remaining install steps. The error MUST be logged, the group-level error counter MUST be incremented, and subsequent skills and groups MUST continue.

#### Scenario: gluestack-ui-v5 install fails mid-run

- **WHEN** the gluestack-ui-v5 `skills add` command exits non-zero
- **THEN** the failure is logged with the skill name
- **AND** the group-level error counter is incremented by 1
- **AND** the script continues with the next skill in the group and with later groups

### Requirement: gluestack-ui-v5 install does not modify chezmoi-managed files

The gluestack-ui-v5 install step SHALL NOT modify any file managed by chezmoi (notably `~/.claude/settings.json`). Only `skills.sh`-owned locations (`~/.agents/skills/` and the per-agent skills directories it links into, such as `~/.claude/skills/` and `~/.junie/skills/`) MAY change as a result of this step.

#### Scenario: settings.json is untouched after install

- **WHEN** the gluestack-ui-v5 install step completes successfully
- **THEN** the content of `~/.claude/settings.json` is byte-identical to its content before the step ran

#### Scenario: No new files appear outside skills.sh-owned paths

- **WHEN** the gluestack-ui-v5 install step completes
- **THEN** all newly created files or symlinks live under `~/.agents/skills/gluestack-ui-v5/` or in `skills.sh`-managed per-agent skill links
- **AND** no chezmoi-managed path is created or modified

### Requirement: Non-macOS manual instructions include gluestack-ui-v5

The non-macOS branch of the install script SHALL display the literal gluestack-ui-v5 install command, including its agent selection, as part of its manual-instructions block so users on other platforms can install the skill by copy-paste.

#### Scenario: Script runs on a non-macOS platform

- **WHEN** the install script executes on a platform other than macOS
- **THEN** the displayed manual-instructions block includes the gluestack-ui-v5 install line with the same `-g` flag and agent selection as the macOS path
- **AND** the line appears alongside the existing skill install commands, not in a separate section
