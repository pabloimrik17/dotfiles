## MODIFIED Requirements

### Requirement: Scope is user-scope config only

The skill SHALL activate only for chezmoi-managed user-scope agentic-tool configuration: `dot_claude/**` and the Claude Code user-scope registrations in `run_onchange_install-packages.sh.tmpl` (`MCP_HTTP_SERVERS`, `MCP_STDIO_SERVERS`, `CC_MARKETPLACES`, `CC_PLUGINS`), a future `dot_codex/**` surface (Codex), `dot_config/opencode/**` (OpenCode), and the Junie user-scope surface once the repository manages one. One tool's user-scope configuration MAY span more than one source path: Claude Code's MCP servers are registered by the install script into `~/.claude.json`, a file the `mcp-global-config` capability forbids `dot_claude/modify_settings.json.tmpl` from carrying, so `dot_claude/**` alone does not cover them. Changes to that install script that are not agentic-tool configuration, including tool installation, brew packages, gh extensions, and unrelated tooling, belong to other skills such as `classify-tool-updates`, not to this skill. The skill SHALL NOT activate for project-level agent configuration in this repository (`.claude/`, `.codex/`, `.opencode/`, `.junie/`, `.agents/`, `.mcp.json`, `opencode.json`, `AGENTS.md`, `CLAUDE.md`).

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

### Requirement: Additions, modifications, and removals are all covered

The skill SHALL handle all three change kinds symmetrically: a config entry added to one tool proposes an addition to the other three, a modified entry proposes the matching modification, and a removed entry proposes the matching removal.

#### Scenario: Entry added to one tool

- **WHEN** an MCP server, permission rule, plugin, or setting is added to one tool's user config
- **THEN** the skill proposes adding the equivalent entry to the other three tools

#### Scenario: Entry removed from one tool

- **WHEN** an entry is removed from one tool's user config
- **THEN** the skill proposes removing its counterpart from the other three tools

### Requirement: Gaps are recorded, not silently skipped

When a configuration feature has no equivalent in a target tool, the skill SHALL report that explicitly as a gap, naming the tool and the feature, and SHALL record it in the parity table. Every proposal SHALL include Claude Code, Codex, OpenCode, and Junie either with a concrete counterpart or an explicit gap; silently omitting a tool is not permitted.

#### Scenario: Feature has no counterpart

- **WHEN** a tool-specific feature such as a hook or plugin has no equivalent in one or more of the other tools
- **THEN** the skill reports the gap for each affected tool and records it in the parity table instead of omitting those tools

### Requirement: Parity table lives in the skill and starts empty

The skill SHALL own a parity table at `.agents/skills/sync-agent-config/parity.md` with the columns `capability`, `Claude Code`, `Codex`, `OpenCode`, `Junie`, and `notes`. It SHALL be created with its column headers and no mapping rows. The skill SHALL read the table before proposing a replication and SHALL propose a table update whenever it establishes a new mapping or confirms a gap.

#### Scenario: Table is initialized empty

- **WHEN** the four-tool parity table is initialized
- **THEN** `parity.md` contains `| capability | Claude Code | Codex | OpenCode | Junie | notes |` and zero mapping rows

#### Scenario: New mapping established

- **WHEN** the skill resolves an equivalence between tools that the table does not yet record
- **THEN** the skill proposes adding the corresponding row to `parity.md`

#### Scenario: Table consulted before proposing

- **WHEN** the skill runs on a config change
- **THEN** it reads `parity.md` first and reuses any mapping already recorded there
