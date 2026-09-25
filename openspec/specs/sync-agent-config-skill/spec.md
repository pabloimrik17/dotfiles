# Capability: sync-agent-config-skill

## Purpose

Repo-tooling skill that keeps user-scope agentic-tool configuration comparable across Claude Code, OpenCode, and Junie: on every addition, modification, or removal to one tool's config it proposes the equivalent edit for the others, records the cases where no equivalent exists, and maintains a parity table of the mappings it has established.

## Requirements

### Requirement: Skill exists as repo tooling

The system SHALL provide a skill named `sync-agent-config` whose body lives at `.agents/skills/sync-agent-config/SKILL.md`, exposed to each agent per the `repo-skill-canonical-layout` capability. The skill description SHALL trigger auto-invocation when user-scope agentic-tool configuration changes. Repo-root dot-directories are outside chezmoi's source state, so the skill SHALL NOT be deployed to `$HOME`.

#### Scenario: Skill body is canonical

- **WHEN** the repository is inspected
- **THEN** exactly one `SKILL.md` body for `sync-agent-config` exists, at `.agents/skills/sync-agent-config/SKILL.md`

#### Scenario: Not applied by chezmoi

- **WHEN** `chezmoi apply` runs
- **THEN** nothing under repo-root `.agents/`, `.claude/`, or `.junie/` is deployed to `$HOME`

### Requirement: Scope is user-scope config only

The skill SHALL activate only for chezmoi-managed user-scope agentic-tool configuration: `dot_claude/**` and the Claude Code user-scope registrations in `run_onchange_install-packages.sh.tmpl` (`MCP_HTTP_SERVERS`, `MCP_STDIO_SERVERS`, `CC_MARKETPLACES`, `CC_PLUGINS`), a future `dot_codex/**` surface (Codex), `dot_config/opencode/**` (OpenCode), and `dot_junie/**` (Junie). One tool's user-scope configuration MAY span more than one source path: Claude Code's MCP servers are registered by the install script into `~/.claude.json`, a file the `mcp-global-config` capability forbids `dot_claude/modify_settings.json.tmpl` from carrying, so `dot_claude/**` alone does not cover them. Changes to that install script that are not agentic-tool configuration, including tool installation, brew packages, gh extensions, and unrelated tooling, belong to other skills such as `classify-tool-updates`, not to this skill. The skill SHALL NOT activate for project-level agent configuration in this repository (`.claude/`, `.codex/`, `.opencode/`, `.junie/`, `.agents/`, `.mcp.json`, `opencode.json`, `AGENTS.md`, `CLAUDE.md`).

#### Scenario: Claude Code user config changes

- **WHEN** a file under `dot_claude/` is added, modified, or removed
- **THEN** the skill activates

#### Scenario: Claude Code MCP server registration changes

- **WHEN** an entry in `MCP_HTTP_SERVERS` or `MCP_STDIO_SERVERS` in `run_onchange_install-packages.sh.tmpl` is added, modified, or removed
- **THEN** the skill activates and treats it as a Claude Code user-scope change

#### Scenario: Install script changes unrelated to agent config

- **WHEN** only non-agent-config entries in `run_onchange_install-packages.sh.tmpl` change, such as a tool installer, brew package, or gh extension
- **THEN** the skill does NOT activate

#### Scenario: Codex user config changes

- **WHEN** a file under `dot_codex/` is added, modified, or removed
- **THEN** the skill activates and treats it as a Codex user-scope change

#### Scenario: OpenCode user config changes

- **WHEN** a file under `dot_config/opencode/` is added, modified, or removed
- **THEN** the skill activates

#### Scenario: Project-level agent config changes

- **WHEN** only project-level agent files such as `.mcp.json`, `.codex/config.toml`, `opencode.json`, or `.claude/commands/` change
- **THEN** the skill does NOT activate

### Requirement: Proposal-only, never unattended application

For every replication the skill identifies, it SHALL present the target tool, parity status, target surface, and concrete action, then wait for user confirmation before writing a file or mutating runtime-owned state. A target surface SHALL be a chezmoi source path and key, an official runtime-owned command or UI, or `none` for a capability gap. An already-satisfied counterpart SHALL be reported without proposing a duplicate action.

#### Scenario: User confirms a proposal

- **WHEN** the skill proposes an equivalent edit and the user confirms it
- **THEN** the edit is applied to the target tool's configuration file

#### Scenario: User confirms a runtime-owned proposal

- **WHEN** the skill proposes an official runtime command and the user confirms it
- **THEN** the command is run without creating a chezmoi-managed substitute

#### Scenario: User rejects a proposal

- **WHEN** the user rejects a proposed file edit or runtime command
- **THEN** neither target configuration nor runtime-owned state is modified

### Requirement: Additions, modifications, and removals are all covered

The skill SHALL handle all three change kinds symmetrically: a config entry added to one tool proposes an addition to the other three, a modified entry proposes the matching modification, and a removed entry proposes the matching removal.

#### Scenario: Entry added to one tool

- **WHEN** an MCP server, permission rule, plugin, or setting is added to one tool's user config
- **THEN** the skill proposes adding the equivalent entry to the other three tools

#### Scenario: Entry removed from one tool

- **WHEN** an entry is removed from one tool's user config
- **THEN** the skill proposes removing its counterpart from the other three tools

### Requirement: Gaps are recorded, not silently skipped

When a configuration feature has no equivalent in a target tool, the skill SHALL report that explicitly as a capability gap, naming the tool and feature, and SHALL record it in the parity table. Runtime ownership without a chezmoi file SHALL NOT be classified as a capability gap when an official counterpart exists. Every proposal SHALL include Claude Code, Codex, OpenCode, and Junie as a concrete managed counterpart, an official runtime-owned counterpart, an already-satisfied counterpart, or an explicit gap.

#### Scenario: Feature has no counterpart

- **WHEN** a tool-specific feature has no equivalent in one or more target tools
- **THEN** the skill reports the gap for each affected tool and records `none` with a reason instead of omitting those tools

#### Scenario: Counterpart is runtime-owned

- **WHEN** a target tool provides an official counterpart only through runtime-owned state
- **THEN** the skill records its stable identifier and supported action instead of inventing a chezmoi file or recording `none`

### Requirement: Parity table lives in the skill and starts empty

The skill SHALL own a parity table at `.agents/skills/sync-agent-config/parity.md` with the columns `capability`, `Claude Code`, `Codex`, `OpenCode`, `Junie`, and `notes`. It SHALL be created with its column headers, and SHALL carry only the mapping rows the skill has established. The skill SHALL read the table before proposing a replication and SHALL propose a table update whenever it establishes a new mapping, refreshes a stale mapping, or confirms a gap. Every mapping row SHALL have all six cells populated; runtime-owned counterparts SHALL use a stable identifier, while `none` SHALL be reserved for a true capability gap.

#### Scenario: Table is initialized empty

- **WHEN** the four-tool parity table is initialized before any mapping is established
- **THEN** `parity.md` contains `| capability | Claude Code | Codex | OpenCode | Junie | notes |` and no mapping rows

#### Scenario: Established mapping is preserved

- **WHEN** the table already records the Superpowers mapping
- **THEN** the row is retained with all six cells populated rather than reset to an empty table

#### Scenario: New mapping established

- **WHEN** the skill resolves an equivalence that the table does not yet record
- **THEN** it proposes a complete six-column row in `parity.md`

#### Scenario: Table consulted before proposing

- **WHEN** the skill runs on a config change
- **THEN** it reads `parity.md` first and reuses a current mapping or proposes correcting a stale one

#### Scenario: Runtime-owned mapping is recorded

- **WHEN** the skill records Codex's official Superpowers counterpart
- **THEN** the Codex cell contains `superpowers@openai-curated` and the notes explain that Codex owns the local runtime state

### Requirement: Docs delegation

The skill SHALL NOT edit `README.md` or `docs/manual.html`. After a confirmed config change it SHALL defer documentation follow-up to the existing `update-manual` and `update-readme` skills.

#### Scenario: Config replicated across tools

- **WHEN** a replication proposal is confirmed and applied
- **THEN** the skill points to `update-manual`/`update-readme` for documentation instead of editing docs directly
