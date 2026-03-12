## MODIFIED Requirements

### Requirement: Hook is defined in project config

The `post-create` hook in `.config/wt.toml` SHALL include both `wt step copy-ignored` for forward-copying gitignored files AND a `save-base` command that persists the base worktree path to `.claude/.worktree-base`.

Example configuration:

```toml
[post-create]
copy = "wt step copy-ignored"
save-base = "echo '{{ base_worktree_path }}' > .claude/.worktree-base"
```

#### Scenario: Hook is shared across team

- **WHEN** a developer clones the repo and uses `wt switch --create`
- **THEN** the copy hook and save-base hook run automatically (after security approval)

#### Scenario: Base path is saved alongside file copy

- **WHEN** a new worktree is created
- **THEN** `wt step copy-ignored` runs first, then the base path is saved to `.claude/.worktree-base`
