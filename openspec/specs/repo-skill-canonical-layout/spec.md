# Capability: repo-skill-canonical-layout

## Purpose

Defines where repo-owned agent skills live and how each agent discovers them: one canonical body under `.agents/skills/`, exposed to the agents that cannot read that directory through relative symlinks, mirroring the layout `gh skill install` and `skills.sh` already produce at user scope.

## Requirements

### Requirement: One canonical body per repo-owned skill

Every skill authored in this repository SHALL have exactly one body directory, at `.agents/skills/<name>/`, holding its `SKILL.md` and any supporting files. Duplicated skill bodies across per-tool directories are not permitted.

#### Scenario: Repo-owned skill is inspected

- **WHEN** a repo-owned skill is located in the repository
- **THEN** its `SKILL.md` is a regular file under `.agents/skills/<name>/` and every other occurrence of that skill name resolves to the same file

#### Scenario: Duplicate body introduced

- **WHEN** a second regular-file copy of a repo-owned skill's `SKILL.md` appears under `.claude/skills/` or `.junie/skills/`
- **THEN** that copy is a defect and is replaced by a symlink to the canonical body

### Requirement: Claude Code discovery via relative symlink

Because Claude Code discovers skills only under enterprise, personal, and project `.claude/skills/` and does not read `.agents/skills/`, each repo-owned skill SHALL be exposed at `.claude/skills/<name>` as a relative symlink to `../../.agents/skills/<name>`. Claude Code follows such symlinks and loads a target reachable from more than one location once.

#### Scenario: Claude Code loads a repo-owned skill

- **WHEN** a Claude Code session starts in the repository
- **THEN** each repo-owned skill is available, resolved through its `.claude/skills/<name>` symlink

#### Scenario: Symlink is relative

- **WHEN** the symlink at `.claude/skills/<name>` is read
- **THEN** its target is the relative path `../../.agents/skills/<name>`, so it resolves identically in every worktree and clone

### Requirement: OpenCode needs no per-tool entry

OpenCode discovers `.agents/skills/` and `.claude/skills/` natively at project scope. No entry SHALL be created under `.opencode/skills/` for a repo-owned skill.

#### Scenario: OpenCode session in the repository

- **WHEN** an OpenCode session starts in the repository
- **THEN** each repo-owned skill is discovered without any file existing under `.opencode/skills/`

### Requirement: Codex needs no per-tool entry

Codex SHALL discover repo-owned skills directly from `.agents/skills/` while walking from the session working directory to the repository root. Repo-owned skill names SHALL remain unique across repository `.agents/skills/` roots, with the repository-root `.agents/skills/<name>` as the sole supported definition. No repo-owned skill entry SHALL be created under `.codex/skills/`, and any generator-owned content already present there SHALL remain outside this capability.

#### Scenario: Codex session starts inside the repository

- **WHEN** a Codex session starts at the repository root or in a descendant directory
- **THEN** every repo-owned skill is discovered from `.agents/skills/<name>/SKILL.md`
- **AND** each repo-owned skill appears exactly once

#### Scenario: Codex-specific duplicate is inspected

- **WHEN** the repository layout is checked for a repo-owned skill
- **THEN** no `.codex/skills/<name>` symlink or regular-file copy exists for that skill

#### Scenario: Generator-owned Codex skills are present

- **WHEN** `.codex/skills/` contains OpenSpec-generated output
- **THEN** that output is not treated as a repo-owned skill and is left untouched

### Requirement: Junie exposure is verified, not assumed

Junie's own documentation claims `.agents/skills/` discovery while JetBrains issue JUNIE-2381 remains open. Each repo-owned skill SHALL therefore be exposed at `.junie/skills/<name>` as a relative symlink to `../../.agents/skills/<name>`, and Junie discovery SHALL be checked empirically. If Junie is confirmed to read `.agents/skills/` and the symlink causes the skill to be offered twice, the `.junie/skills/` symlink SHALL be removed.

#### Scenario: Junie does not read .agents/skills

- **WHEN** Junie discovers the skill only through `.junie/skills/<name>`
- **THEN** the symlink is retained

#### Scenario: Junie double-loads the skill

- **WHEN** Junie is confirmed to read `.agents/skills/` and lists the skill twice with the symlink present
- **THEN** the `.junie/skills/<name>` symlink is removed and the skill is left to `.agents/skills/` discovery

### Requirement: Duplicate-discovery check per agent

Before the layout is accepted, each agent SHALL be checked for double-listing of a skill reachable through both its canonical path and a symlink. Claude Code documents deduplication by target; OpenCode and Junie do not. Any agent found to double-list SHALL have the redundant exposure removed.

#### Scenario: Agent lists a skill once

- **WHEN** an agent's skill listing is inspected after the migration
- **THEN** each repo-owned skill appears exactly once

### Requirement: Generator-owned skills are excluded

Skills generated by external tooling SHALL be left under the per-tool directories that tooling manages. `openspec update` detects the agent directories present and regenerates its own per-tool copies with no target selection, so the `openspec-*` skills, the `.agents/skills/.openspec-target` marker, and the superseded `.codex/skills/` tree SHALL NOT be migrated, symlinked, or deleted by this capability.

#### Scenario: openspec regenerates its skills

- **WHEN** `openspec update` runs after the migration
- **THEN** it rewrites only its own per-tool `openspec-*` copies and no repo-owned skill body or symlink is disturbed

#### Scenario: Stale generator output present

- **WHEN** a generator-owned directory such as `.codex/skills/` holds output from an older generator version
- **THEN** this capability leaves it untouched
