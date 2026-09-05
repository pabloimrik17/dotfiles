# Capability: tuicr-skill-install

## Purpose

Provision the upstream tuicr agent skill (`agavra/tuicr`) globally via `skills.sh` during chezmoi setup, so Claude Code, OpenCode, Junie, and Codex can read a human's tuicr review as structured JSON (`tuicr review list` / `review comments`) instead of parsing a pasted export. Install shares the existing agent-skills group's confirmation prompt, skills-list cache, and error counter. Upstream rather than vendored: the skill encodes the CLI contract and tracks it as tuicr evolves.

## ADDED Requirements

### Requirement: tuicr skill is installed globally via skills.sh

The install script (`run_onchange_install-packages.sh.tmpl`) SHALL install the `tuicr` skill from the `agavra/tuicr` repository during the existing agent-skills installation group, reusing the group's shared `install_skill <repo> <name> <agents>` helper and its error handling. The executed command MUST include the `-g` global flag, MUST explicitly target the agents `claude-code`, `opencode`, `junie`, and `codex`, and MUST be placed inside the group's confirmation-gated block so it shares the single user prompt with the other global skills.

#### Scenario: First run on clean machine with npx available and user confirms

- **WHEN** `chezmoi apply` runs the install script, `npx` is available, and the user confirms the agent-skills group
- **THEN** the script executes `npx -y skills add agavra/tuicr --skill tuicr -g -y --agent claude-code opencode junie codex`
- **AND** the skill payload is staged at `~/.agents/skills/tuicr/`
- **AND** no prompt or additional confirmation is requested beyond the group-level one

#### Scenario: User declines the agent-skills group

- **WHEN** the user declines the confirmation prompt that gates the agent-skills group
- **THEN** the tuicr skill is not installed
- **AND** no `npx -y skills add agavra/tuicr …` command is executed

#### Scenario: npx is not available

- **WHEN** `npx` is not found on the system during script execution
- **THEN** the tuicr install is skipped together with the rest of the agent-skills group
- **AND** a warning is logged
- **AND** the script continues to subsequent groups

### Requirement: tuicr skill is available to Claude Code, OpenCode, Junie, and Codex

The install step SHALL make the `tuicr` skill discoverable by all four agents in use, following the linking and shared-store resolution behavior of the current `skills.sh` CLI. All four are named explicitly rather than relying on the CLI's default agent resolution, matching the `gluestack-ui-v5-skill-install` precedent: the skill is agent-agnostic and the same repos are reviewed from every agent.

#### Scenario: All four agents can discover the skill after install

- **WHEN** the install step completes successfully on the user's machine
- **THEN** a `tuicr` symlink exists under `~/.claude/skills/` pointing into `~/.agents/skills/`
- **AND** a `tuicr` symlink exists under `~/.junie/skills/` pointing into `~/.agents/skills/`
- **AND** `npx -y skills list -g --json` reports the `tuicr` entry with `Claude Code`, `OpenCode`, `Junie`, and `Codex` all present in its `agents` list

#### Scenario: Agent selection arguments are explicit, not default-dependent

- **WHEN** the install command is executed on a machine where `skills.sh` default agent resolution differs (e.g., additional agents installed)
- **THEN** the command's explicit agent arguments still name exactly `claude-code`, `opencode`, `junie`, and `codex`
- **AND** coverage of these four agents does not depend on CLI default-resolution behavior

### Requirement: tuicr install is idempotent via the shared skills-list cache

The tuicr install step SHALL consult the same `npx -y skills list -g --json` result that the agent-skills group already caches, and SHALL skip invocation only when `tuicr` is present in that output AND every requested agent target is already covered by that entry's `agents` list. When any requested target is missing, the step SHALL proceed with `skills add` so the declared coverage is reconciled rather than left drifted.

#### Scenario: tuicr already installed with full agent coverage

- **WHEN** the agent-skills group runs and `tuicr` appears in the cached `skills list -g --json` output with `claude-code`, `opencode`, `junie`, and `codex` all covered
- **THEN** `npx -y skills add agavra/tuicr …` is NOT executed
- **AND** an info message indicates tuicr is already installed

#### Scenario: cached skill is missing a requested agent target

- **WHEN** `tuicr` appears in the cached output but its `agents` list omits one or more of `claude-code`, `opencode`, `junie`, `codex`
- **THEN** the skip is NOT taken and the full `skills add` command with all four agent arguments is executed

#### Scenario: skills-list cache query fails

- **WHEN** the `npx -y skills list -g --json` cache query fails (e.g., network or runtime error)
- **THEN** the group proceeds without the skip-check, consistent with other skills in the same group
- **AND** the tuicr install is attempted; if it fails because the skill is already installed, the error counter is incremented and the script continues

### Requirement: tuicr install failures do not abort the script

A failure of the tuicr `skills add` invocation SHALL NOT stop execution of the remaining install steps. The error MUST be logged, the group-level error counter MUST be incremented, and subsequent skills and groups MUST continue.

#### Scenario: tuicr install fails mid-run

- **WHEN** the tuicr `skills add` command exits non-zero
- **THEN** the failure is logged with the skill name
- **AND** the group-level error counter is incremented by 1
- **AND** the script continues with the next skill in the group and with later groups

### Requirement: tuicr install does not modify chezmoi-managed files

The tuicr install step SHALL NOT modify any file managed by chezmoi — notably `~/.claude/settings.json` and the chezmoi-managed `~/.config/tuicr/config.toml`. Only `skills.sh`-owned locations (`~/.agents/skills/` and the per-agent skill links into it) MAY change as a result of this step.

#### Scenario: Managed configs are untouched after install

- **WHEN** the tuicr install step completes successfully
- **THEN** the content of `~/.claude/settings.json` is byte-identical to its content before the step ran
- **AND** the content of `~/.config/tuicr/config.toml` is byte-identical to its content before the step ran

#### Scenario: No new files appear outside skills.sh-owned paths

- **WHEN** the tuicr install step completes
- **THEN** all newly created files or symlinks live under `~/.agents/skills/tuicr/` or in `skills.sh`-managed per-agent skill links
- **AND** no chezmoi-managed path is created or modified

### Requirement: The skill reads reviews, and only writes with explicit approval

The installed skill SHALL be the agent-side half of the review loop: it discovers sessions with `tuicr review list` (selecting the row with `"active": true`), reads the human's feedback with `tuicr review comments`, and gates `tuicr review add` behind explicit user approval. Unattended agent-authored comments are out of scope for this capability.

#### Scenario: Agent reads a live review without being told the CLI shape

- **WHEN** a tuicr session is open and the user asks an agent to read the review
- **THEN** the agent invokes the skill, resolves the session slug from `tuicr review list`, and reports the comments
- **AND** it does not require the CLI invocation to be dictated by hand

#### Scenario: Agent-authored comments require approval

- **WHEN** an agent would add its own findings to a session via `tuicr review add`
- **THEN** it asks for explicit user approval first

### Requirement: The skill's comment-type vocabulary tolerates the curated ids

The skill's documented legend (`issue`, `suggestion`, `note`, `praise`) SHALL NOT constrain the ids configured in `tuicr-config`. `tuicr review comments` emits the configured `comment_type` string verbatim and never the `definition`, so ids outside the legend — `question` and `nit` — reach the agent as plain English rather than as an error.

#### Scenario: Unmapped ids degrade to plain English

- **WHEN** an agent reads comments typed `question` or `nit`
- **THEN** `comment_type` carries those ids verbatim
- **AND** neither the CLI nor the skill errors on an id outside its documented legend

### Requirement: Non-macOS manual instructions include tuicr

The non-macOS branch of the install script SHALL display the literal tuicr skill install command, including its agent selection, as part of its manual-instructions block, in the same order as the `install_skill` calls, so users on other platforms can install the skill by copy-paste.

#### Scenario: Script runs on a non-macOS platform

- **WHEN** the install script executes on a platform other than macOS
- **THEN** the displayed manual-instructions block includes `npx -y skills add agavra/tuicr --skill tuicr -g -y --agent claude-code opencode junie codex`
- **AND** the line appears alongside the existing skill install commands, not in a separate section
