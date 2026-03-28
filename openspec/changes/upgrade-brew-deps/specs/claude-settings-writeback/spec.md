## MODIFIED Requirements

### Requirement: Base worktree path is saved at creation time

The system SHALL save `{{ base_worktree_path }}` to `.claude/.worktree-base` in the `pre-start` hook (renamed from `post-create` per worktrunk 0.32) defined in `worktree-file-sync/spec.md` (alongside `wt step copy-ignored`), so that `pre-remove` can identify the source worktree.

#### Scenario: Base path persisted on worktree creation

- **WHEN** a new worktree is created with `wt switch --create feature/A` from the `develop` worktree
- **THEN** `.claude/.worktree-base` in the new worktree SHALL contain the absolute path to the `develop` worktree
