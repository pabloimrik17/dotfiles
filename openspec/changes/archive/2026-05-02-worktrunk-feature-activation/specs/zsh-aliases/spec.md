## ADDED Requirements

### Requirement: wsc shortcut for worktree-with-claude

The zshrc SHALL define an alias `wsc` that resolves to `wt switch --create --execute=claude`, allowing a one-step worktree creation that immediately launches Claude Code in the new worktree.

#### Scenario: wsc creates a worktree and runs claude

- **WHEN** the user types `wsc <branch>`
- **THEN** worktrunk SHALL create a new worktree for `<branch>`, run all configured pre-start and post-start hooks, and then start `claude` inside that worktree

#### Scenario: wsc forwards extra args to claude

- **WHEN** the user types `wsc <branch> -- 'Fix GH #322'`
- **THEN** worktrunk SHALL forward `'Fix GH #322'` as the initial prompt to `claude` in the new worktree

#### Scenario: wsc available after chezmoi apply

- **WHEN** the user runs `chezmoi apply` and starts a new shell
- **THEN** `alias wsc` SHALL be defined and resolve to `wt switch --create --execute=claude`
