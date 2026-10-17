# agent-instructions Specification

## Purpose

Keep agent instructions in a canonical AGENTS.md body while preserving discovery, user content and the distinction between repository and user scope.

## Requirements

### Requirement: Repository instructions have one maintained body

The repository SHALL maintain its shared instructions in root `AGENTS.md`. Root `CLAUDE.md` SHALL NOT exist: Claude Code (2.1.277 or later) reads root `AGENTS.md` natively, so a compatibility import is no longer needed. A `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` in the working directory or any ancestor makes Claude Code read only the `CLAUDE.md` files. The migration SHALL preserve all existing instructions, including the Bun package-manager policy.

#### Scenario: Existing identical files

- **WHEN** the repository's current identical instruction files are migrated
- **THEN** `AGENTS.md` SHALL retain the complete instruction body and root `CLAUDE.md` SHALL be removed
- **AND** a future edit to that body SHALL require editing only `AGENTS.md`

#### Scenario: Source files diverged before implementation

- **WHEN** either instruction file has gained unique content
- **THEN** migration SHALL preserve that content in `AGENTS.md` before removing `CLAUDE.md`
- **AND** contradictory instructions SHALL be presented to the user rather than silently discarded

### Requirement: Migration preserves user scope and ownership

User instruction migration SHALL operate only on actual repo-managed user instruction sources. It SHALL preserve their content and scope, retain a working host entry point, and avoid overwriting unmanaged instructions. The absence of managed user `CLAUDE.md` files SHALL be reported as a no-op rather than cause creation of empty migration targets.

#### Scenario: No managed user instruction files exist

- **WHEN** the source inventory and chezmoi managed-file list contain no user `CLAUDE.md` source
- **THEN** the migration SHALL record that no user-scope file needs migration
- **AND** it SHALL NOT create a new global instructions tree solely to simulate a migration

#### Scenario: Managed user instructions exist on the target revision

- **WHEN** a managed user `CLAUDE.md` source is found during the pre-apply inventory
- **THEN** its body SHALL move to an `AGENTS.md` source at the same scope with a verified discovery path for its consuming host
- **AND** any existing destination content SHALL be preserved and reconciled before replacement

#### Scenario: Unmanaged Inbox notes already exist

- **WHEN** the host has `~/.codex/AGENTS.md` or `~/.claude/rules/plannotator-inbox.md` created by Plannotator
- **THEN** migration SHALL leave those files and any user edits intact
- **AND** it SHALL NOT copy them into the dotfiles without a separate explicit scope decision

### Requirement: Discovery and application boundaries remain valid

The migration SHALL preserve instruction discovery by the repository's supported agents and keep repo-only instruction files excluded from chezmoi deployment. Documentation SHALL distinguish host-supported global locations from repository files and warn about precedence when introducing a global `AGENTS.md`.

#### Scenario: Repository discovery

- **WHEN** a fresh supported agent session starts in the repository, with native `AGENTS.md` support available (Claude Code 2.1.277 or later, built-in AGENTS plugin enabled)
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
