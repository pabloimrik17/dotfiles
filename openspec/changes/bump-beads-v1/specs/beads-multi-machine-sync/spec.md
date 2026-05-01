## ADDED Requirements

### Requirement: bd config apply runs after every bd dolt pull

The user-level beads workflow SHALL include `bd config apply` as a manual command run immediately after `bd dolt pull` on every machine where `.beads/` exists. This routine remediates drift in three system-state domains that `bd dolt pull` does not touch on its own: git hooks installed in `.beads/hooks/`, the Dolt remote URL (`federation.remote`), and the Dolt server state (`dolt.shared-server`).

#### Scenario: User pulls beads data on a secondary machine

- **WHEN** the user runs `bd dolt pull` on machine B after a config change was pushed from machine A
- **THEN** the user runs `bd config apply` immediately after, before any other `bd` operation, to converge machine B's hooks/remote/server state with the pulled config

#### Scenario: bd config apply is idempotent

- **WHEN** the user runs `bd config apply` and there is no drift
- **THEN** the command exits successfully reporting all checks as `ok` or `skipped` without modifying state

#### Scenario: bd config apply with --dry-run

- **WHEN** the user runs `bd config apply --dry-run` after a `bd dolt pull`
- **THEN** the command reports what changes would be made (e.g., `applied`, `dry_run`, `skipped`, `error`) without modifying any state

### Requirement: Schema v11 migration is one-way and requires per-machine backup

The `.beads/` directory on every machine SHALL be backed up (via `cp -a .beads .beads.pre-v11.bak` or equivalent) before the first `bd` invocation following a `brew upgrade beads` from any 0.x version to 1.x. The schema v11 migration runs automatically on first invocation and cannot be reversed without restoring the backup.

#### Scenario: Backup exists before first post-upgrade invocation

- **WHEN** the user runs `bd ready` (or any `bd` command) for the first time after `brew upgrade beads` to 1.0.3
- **THEN** a `.beads.pre-v11.bak` directory exists adjacent to `.beads/` containing a complete copy of the pre-migration database

#### Scenario: Migration triggers automatically

- **WHEN** the user runs the first `bd` command on a machine immediately after upgrade
- **THEN** the schema v11 migration executes without user prompting and completes without error

#### Scenario: Rollback via backup restore

- **WHEN** the user determines a rollback is necessary after migration
- **THEN** the user can restore the pre-migration state by removing the migrated `.beads/` and renaming `.beads.pre-v11.bak` back to `.beads/`, after also downgrading the `beads` brew formula to a 0.x version

### Requirement: Cross-machine bd dolt operations require version parity

The user SHALL NOT perform `bd dolt push` or `bd dolt pull` between machines that are on different beads major versions (e.g., one on 0.62 and another on 1.0.3). Cross-machine sync requires every participating machine to be at 1.0.3 or higher.

#### Scenario: Mixed-version cross-machine sync attempted

- **WHEN** machine A is on beads 1.0.3 (schema v11) and machine B is still on 0.62 (pre-v11) and the user attempts `bd dolt pull` on machine B from A's pushed state
- **THEN** the user halts the operation; the documented expectation is to upgrade machine B to 1.0.3 first

#### Scenario: All machines at 1.0.3 before resuming cross-machine sync

- **WHEN** every machine that participates in `bd dolt push/pull` is confirmed running 1.0.3
- **THEN** cross-machine sync resumes using the documented `bd dolt pull && bd config apply` routine

### Requirement: Auto-push remains disabled by default after upgrade

The user-level beads workflow SHALL accept the upstream 1.0.3 default of `bd dolt push` auto-push being disabled. The user SHALL NOT re-enable auto-push to restore 0.62 behavior; pushes SHALL be explicit `bd dolt push` invocations.

#### Scenario: Push is explicit

- **WHEN** the user makes a beads change on machine A (e.g., `bd update <id> --status closed`)
- **THEN** the change does not propagate to other machines until the user explicitly runs `bd dolt push`

#### Scenario: No auto-push regression

- **WHEN** inspecting beads config after upgrade
- **THEN** any `auto_push` or equivalent setting is at its 1.0.3 default (disabled), not overridden to true
