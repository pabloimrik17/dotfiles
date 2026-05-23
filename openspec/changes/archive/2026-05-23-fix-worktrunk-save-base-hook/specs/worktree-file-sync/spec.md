## MODIFIED Requirements

### Requirement: Gitignored files are copied on worktree creation

The system SHALL copy whitelisted gitignored files from the source worktree to the new worktree when `wt switch --create` is used, via a `pre-start` hook running `wt step copy-ignored`.

#### Scenario: New worktree gets Claude settings

- **WHEN** a new worktree is created with `wt switch --create <branch>`
- **THEN** `.claude/settings.local.json` is copied from the main worktree to the new worktree

#### Scenario: Existing files are not overwritten

- **WHEN** a worktree already has `.claude/settings.local.json`
- **THEN** `wt step copy-ignored` SHALL skip the file (default behavior, no `--force`)

### Requirement: Hook is defined in project config

The `pre-start` hook in `.config/wt.toml` SHALL include both `wt step copy-ignored` for forward-copying gitignored files AND a `save-base` command that persists the sync target path to `.claude/.worktree-base`. The `save-base` command SHALL render `{{ base_worktree_path | default(primary_worktree_path) }}` so the path resolves to the base worktree on `--create` and falls back to the primary worktree on `wt switch <existing-branch>`, where `base_*` is undefined.

Example configuration:

```toml
[[pre-start]]
copy = "wt step copy-ignored"

[[pre-start]]
save-base = "echo '{{ base_worktree_path | default(primary_worktree_path) }}' > .claude/.worktree-base"
```

#### Scenario: Hook is shared across team

- **WHEN** a developer clones the repo and uses `wt switch --create`
- **THEN** the copy hook and save-base hook run automatically (after security approval)

#### Scenario: Sync target path is saved alongside file copy

- **WHEN** a new worktree is created
- **THEN** `wt step copy-ignored` runs first, then the sync target path is saved to `.claude/.worktree-base`
