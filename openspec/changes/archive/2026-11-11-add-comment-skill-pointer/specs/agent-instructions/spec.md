## ADDED Requirements

### Requirement: Comment-writing policy is reached before editing comments

Root `AGENTS.md` SHALL contain exactly once: "Before writing or editing code comments, use the experiments:writing-comments skill." The skill SHALL remain the single source of comment policy. This pointer SHALL stay repository-scoped, without adding a managed global `CLAUDE.md`, a forwarding file, or a parity-table entry.

#### Scenario: Agent reads repository instructions

- **WHEN** an agent reads root `AGENTS.md` before writing or editing code comments
- **THEN** it SHALL find one instruction to use `experiments:writing-comments`
- **AND** the comment policy itself SHALL remain in the skill rather than be copied into repository instructions

#### Scenario: Host instructions remain unchanged

- **WHEN** this change is deployed
- **THEN** it SHALL add no managed `dot_claude/CLAUDE.md` or forwarding file
- **AND** existing host instructions and parity mappings SHALL remain unchanged

## MODIFIED Requirements

### Requirement: Repository instructions have one maintained body

The repository SHALL maintain its shared instructions in root `AGENTS.md`. Root `CLAUDE.md` SHALL NOT exist: Claude Code (2.1.277 or later) reads root `AGENTS.md` natively, so a compatibility import is no longer needed. A `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` in the working directory or any ancestor makes Claude Code read only the `CLAUDE.md` files. The maintained body SHALL retain the Bun command-equivalence table and omit the standalone sentence mandating Bun exclusively. Future instruction migrations SHALL preserve the reviewed instruction body.

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

- **WHEN** a fresh supported agent session starts in the repository, with native `AGENTS.md` support available (Claude Code 2.1.277 or later, built-in AGENTS plugin enabled)
- **THEN** it SHALL receive the comment-writing skill pointer and Bun command-equivalence table through root `AGENTS.md`, which Claude Code reads natively
- **AND** no independent duplicate policy body SHALL be maintained

#### Scenario: Repository files are not deployed to the home directory

- **WHEN** chezmoi computes targets
- **THEN** root `AGENTS.md` SHALL remain ignored as repo tooling
- **AND** a root `CLAUDE.md` SHALL stay ignored should one be recreated

#### Scenario: OpenCode 1 global precedence

- **WHEN** documentation discusses creating `~/.config/opencode/AGENTS.md`
- **THEN** it SHALL explain that on OpenCode 1 this takes precedence over the `~/.claude/CLAUDE.md` fallback; OpenCode 2 currently discovers AGENTS files only
- **AND** the migration SHALL NOT create that file with only an Inbox note while losing existing fallback instructions
