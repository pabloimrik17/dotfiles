## MODIFIED Requirements

### Requirement: Repository instructions have one maintained body

The repository SHALL maintain its shared instructions in root `AGENTS.md`. Root `CLAUDE.md` SHALL NOT exist: Claude Code reads root `AGENTS.md` natively only when no `CLAUDE.md` exists in the working directory or any ancestor, so a compatibility import would block that discovery. The migration SHALL preserve all existing instructions, including the Bun package-manager policy.

#### Scenario: Existing identical files

- **WHEN** the repository's current identical instruction files are migrated
- **THEN** `AGENTS.md` SHALL retain the complete instruction body and root `CLAUDE.md` SHALL be removed
- **AND** a future edit to that body SHALL require editing only `AGENTS.md`

#### Scenario: Source files diverged before implementation

- **WHEN** either instruction file has gained unique content
- **THEN** migration SHALL preserve that content in `AGENTS.md` before removing `CLAUDE.md`
- **AND** contradictory instructions SHALL be presented to the user rather than silently discarded

### Requirement: Discovery and application boundaries remain valid

The migration SHALL preserve instruction discovery by the repository's supported agents and keep repo-only instruction files excluded from chezmoi deployment. Documentation SHALL distinguish host-supported global locations from repository files and warn about precedence when introducing a global `AGENTS.md`.

#### Scenario: Repository discovery

- **WHEN** a fresh supported agent session starts in the repository
- **THEN** it SHALL receive the Bun policy through root `AGENTS.md`, which Claude Code reads natively
- **AND** no independent duplicate policy body SHALL be maintained

#### Scenario: Repository files are not deployed to the home directory

- **WHEN** chezmoi computes targets
- **THEN** root `AGENTS.md` SHALL remain ignored as repo tooling
- **AND** a root `CLAUDE.md` SHALL stay ignored should one be recreated

#### Scenario: OpenCode 1 global precedence

- **WHEN** documentation discusses creating `~/.config/opencode/AGENTS.md`
- **THEN** it SHALL explain that on OpenCode 1 this takes precedence over the `~/.claude/CLAUDE.md` fallback; OpenCode 2 currently discovers AGENTS files only
- **AND** the migration SHALL NOT create that file with only an Inbox note while losing existing fallback instructions
