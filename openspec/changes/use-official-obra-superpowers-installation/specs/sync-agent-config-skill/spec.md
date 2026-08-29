## MODIFIED Requirements

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

### Requirement: Gaps are recorded, not silently skipped

When a configuration feature has no equivalent in a target tool, the skill SHALL report that explicitly as a capability gap, naming the tool and feature, and SHALL record it in the parity table. Runtime ownership without a chezmoi file SHALL NOT be classified as a capability gap when an official counterpart exists. Every proposal SHALL include Claude Code, Codex, OpenCode, and Junie as a concrete managed counterpart, an official runtime-owned counterpart, an already-satisfied counterpart, or an explicit gap.

#### Scenario: Feature has no counterpart

- **WHEN** a tool-specific feature has no equivalent in one or more target tools
- **THEN** the skill reports the gap for each affected tool and records `none` with a reason instead of omitting those tools

#### Scenario: Counterpart is runtime-owned

- **WHEN** a target tool provides an official counterpart only through runtime-owned state
- **THEN** the skill records its stable identifier and supported action instead of inventing a chezmoi file or recording `none`

### Requirement: Parity table lives in the skill and starts empty

The skill SHALL own a parity table at `.agents/skills/sync-agent-config/parity.md` with the columns `capability`, `Claude Code`, `Codex`, `OpenCode`, `Junie`, and `notes`. It SHALL be created with its column headers and no mapping rows. The skill SHALL read the table before proposing a replication and SHALL propose a table update whenever it establishes a new mapping, refreshes a stale mapping, or confirms a gap. Every mapping row SHALL have all six cells populated; runtime-owned counterparts SHALL use a stable identifier, while `none` SHALL be reserved for a true capability gap.

#### Scenario: Table is initialized empty

- **WHEN** the four-tool parity table is initialized
- **THEN** `parity.md` contains `| capability | Claude Code | Codex | OpenCode | Junie | notes |` and zero mapping rows

#### Scenario: New mapping established

- **WHEN** the skill resolves an equivalence that the table does not yet record
- **THEN** it proposes a complete six-column row in `parity.md`

#### Scenario: Table consulted before proposing

- **WHEN** the skill runs on a config change
- **THEN** it reads `parity.md` first and reuses a current mapping or proposes correcting a stale one

#### Scenario: Runtime-owned mapping is recorded

- **WHEN** the skill records Codex's official Superpowers counterpart
- **THEN** the Codex cell contains `superpowers@openai-curated` and the notes explain that Codex owns the local runtime state
