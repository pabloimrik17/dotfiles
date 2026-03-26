## MODIFIED Requirements

### Requirement: Gitignored files are copied on worktree creation

The system SHALL copy whitelisted gitignored files from the source worktree to the new worktree when `wt switch --create` is used, via a `pre-start` hook (renamed from `post-create` per worktrunk 0.32) running `wt step copy-ignored`. The hook is blocking — if copy-ignored fails, worktree creation aborts.

#### Scenario: New worktree gets Claude settings

- **WHEN** a new worktree is created with `wt switch --create <branch>`
- **THEN** `.claude/settings.local.json` is copied from the main worktree to the new worktree

#### Scenario: Existing files are not overwritten

- **WHEN** a worktree already has `.claude/settings.local.json`
- **THEN** `wt step copy-ignored` SHALL skip the file (default behavior, no `--force`)

### Requirement: Hook is defined in project config

The `pre-start` hook (renamed from `post-create` per worktrunk 0.32) in `.config/wt.toml` SHALL include both `wt step copy-ignored` for forward-copying gitignored files AND a `save-base` command that persists the base worktree path to `.claude/.worktree-base`.

Example configuration:

```toml
[pre-start]
copy = "wt step copy-ignored"
save-base = "echo '{{ base_worktree_path }}' > .claude/.worktree-base"
```

#### Scenario: Hook is shared across team

- **WHEN** a developer clones the repo and uses `wt switch --create`
- **THEN** the copy hook and save-base hook run automatically (after security approval)

#### Scenario: Base path is saved alongside file copy

- **WHEN** a new worktree is created
- **THEN** `wt step copy-ignored` runs first, then the base path is saved to `.claude/.worktree-base`

#### Scenario: Copy failure aborts worktree creation

- **WHEN** `wt step copy-ignored` fails (e.g., permissions error, disk full)
- **THEN** worktree creation SHALL abort with a visible error (pre-start FailFast semantics)
