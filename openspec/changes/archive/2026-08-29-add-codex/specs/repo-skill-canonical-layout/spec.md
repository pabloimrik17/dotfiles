## ADDED Requirements

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
