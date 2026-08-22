## Purpose

Repo-tooling skill that keeps user-scope agentic-tool configuration comparable across Claude Code, OpenCode, and Junie: on every addition, modification, or removal to one tool's config it proposes the equivalent edit for the others, records the cases where no equivalent exists, and maintains a parity table of the mappings it has established.

## ADDED Requirements

### Requirement: Skill exists as repo tooling

The system SHALL provide a skill named `sync-agent-config` whose body lives at `.agents/skills/sync-agent-config/SKILL.md`, exposed to each agent per the `repo-skill-canonical-layout` capability. The skill description SHALL trigger auto-invocation when user-scope agentic-tool configuration changes. Repo-root dot-directories are outside chezmoi's source state, so the skill SHALL NOT be deployed to `$HOME`.

#### Scenario: Skill body is canonical

- **WHEN** the repository is inspected
- **THEN** exactly one `SKILL.md` body for `sync-agent-config` exists, at `.agents/skills/sync-agent-config/SKILL.md`

#### Scenario: Not applied by chezmoi

- **WHEN** `chezmoi apply` runs
- **THEN** nothing under repo-root `.agents/`, `.claude/`, or `.junie/` is deployed to `$HOME`

### Requirement: Scope is user-scope config only

The skill SHALL activate only for chezmoi-managed user-scope agentic-tool configuration: `dot_claude/**` (Claude Code), `dot_config/opencode/**` (OpenCode), and the Junie user-scope surface once the repository manages one. The skill SHALL NOT activate for project-level agent configuration in this repository (`.claude/`, `.opencode/`, `.junie/`, `.agents/`, `.mcp.json`, `opencode.json`, `AGENTS.md`, `CLAUDE.md`).

#### Scenario: Claude Code user config changes

- **WHEN** a file under `dot_claude/` is added, modified, or removed
- **THEN** the skill activates

#### Scenario: OpenCode user config changes

- **WHEN** a file under `dot_config/opencode/` is added, modified, or removed
- **THEN** the skill activates

#### Scenario: Project-level agent config changes

- **WHEN** only project-level agent files such as `.mcp.json`, `opencode.json`, or `.claude/commands/` change
- **THEN** the skill does NOT activate

### Requirement: Proposal-only, never unattended application

For every replication the skill identifies, it SHALL present the target tool, the target file, and the concrete edit, then wait for user confirmation before writing. The skill SHALL NOT modify any tool's configuration without that confirmation.

#### Scenario: User confirms a proposal

- **WHEN** the skill proposes an equivalent edit and the user confirms it
- **THEN** the edit is applied to the target tool's configuration file

#### Scenario: User rejects a proposal

- **WHEN** the user rejects the proposed edit
- **THEN** no target configuration file is modified

### Requirement: Additions, modifications, and removals are all covered

The skill SHALL handle all three change kinds symmetrically: a config entry added to one tool proposes an addition to the others, a modified entry proposes the matching modification, and a removed entry proposes the matching removal.

#### Scenario: Entry added to one tool

- **WHEN** an MCP server, permission rule, plugin, or setting is added to one tool's user config
- **THEN** the skill proposes adding the equivalent entry to the other two tools

#### Scenario: Entry removed from one tool

- **WHEN** an entry is removed from one tool's user config
- **THEN** the skill proposes removing its counterpart from the other two tools

### Requirement: Gaps are recorded, not silently skipped

When a configuration feature has no equivalent in a target tool, the skill SHALL report that explicitly as a gap, naming the tool and the feature, and SHALL record it in the parity table. Silently omitting a tool from a proposal is not permitted.

#### Scenario: Feature has no counterpart

- **WHEN** a Claude Code-only feature such as a hook or a plugin has no OpenCode or Junie equivalent
- **THEN** the skill reports the gap for each affected tool and records it in the parity table instead of omitting those tools

### Requirement: Parity table lives in the skill and starts empty

The skill SHALL own a parity table at `.agents/skills/sync-agent-config/parity.md`. It SHALL be created with its column headers and no mapping rows. The skill SHALL read the table before proposing a replication and SHALL propose a table update whenever it establishes a new mapping or confirms a gap.

#### Scenario: Table is initialized empty

- **WHEN** the skill is first added to the repository
- **THEN** `parity.md` exists with headers and zero mapping rows

#### Scenario: New mapping established

- **WHEN** the skill resolves an equivalence between two tools that the table does not yet record
- **THEN** the skill proposes adding the corresponding row to `parity.md`

#### Scenario: Table consulted before proposing

- **WHEN** the skill runs on a config change
- **THEN** it reads `parity.md` first and reuses any mapping already recorded there

### Requirement: Docs delegation

The skill SHALL NOT edit `README.md` or `docs/manual.html`. After a confirmed config change it SHALL defer documentation follow-up to the existing `update-manual` and `update-readme` skills.

#### Scenario: Config replicated across tools

- **WHEN** a replication proposal is confirmed and applied
- **THEN** the skill points to `update-manual`/`update-readme` for documentation instead of editing docs directly
