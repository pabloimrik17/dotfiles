## ADDED Requirements

### Requirement: List output schema is pinned

The worktrunk user config SHALL set an explicit `json-schema` value under `[list]`.

Worktrunk's `wt config update` writes this key into the user config whenever it is absent. Because the config is chezmoi-managed, that write is drift: the deployed file gains a key the source does not have, and the repo's standing invariant — that `wt config update` finds nothing to migrate — is broken. Any explicit value closes the loop; the pinned value is a deliberate opt-in to the current schema rather than a forced choice.

#### Scenario: Config update finds nothing to migrate

- **WHEN** `wt config update` is run after `chezmoi apply`
- **THEN** it SHALL report no changes to make

#### Scenario: Deployed config matches source

- **WHEN** `wt config update` has been run and `chezmoi diff` follows
- **THEN** no difference SHALL be reported for the worktrunk config

### Requirement: Worktree location is pinned

The worktrunk user config SHALL set a top-level `worktree-path` template placing new worktrees in a sibling directory named after the repository.

Left unset, worktrunk uses its own default layout while Agent of Empires creates worktrees under a different one, so a single repository accumulates worktrees in two places at once. Pinning the location makes both agree. The setting affects only worktrees created after it lands; existing worktrees are unaffected.

#### Scenario: New worktree lands in the shared layout

- **WHEN** a worktree is created via `wt switch --create`
- **THEN** it SHALL be placed in the repository's sibling worktrees directory

#### Scenario: Existing worktrees are unaffected

- **WHEN** the setting is applied on a machine with worktrees already created under the previous default
- **THEN** those worktrees SHALL continue to function and SHALL NOT be relocated
