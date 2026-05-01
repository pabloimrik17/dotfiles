## MODIFIED Requirements

### Requirement: Git status with split index/worktree counts and stash indicator

The `[git_status]` section SHALL display commit counts for ahead (`⇡${count}`) and behind (`⇣${count}`), full divergence info (`⇕⇡${ahead_count}⇣${behind_count}`), and a stash indicator (`≡`).

The status SHALL render index changes (staged) and worktree changes (unstaged) as separate visual groups via the `index_added`, `index_modified`, `index_deleted`, `worktree_added`, `worktree_modified`, and `worktree_deleted` variables. Index variables SHALL render with green styling and worktree variables SHALL render with red styling. Untracked files SHALL render via the `untracked` variable. The legacy single-symbol `$all_status` form SHALL NOT be used.

#### Scenario: Ahead by N commits

- **WHEN** the local branch is ahead of remote by 3 commits
- **THEN** the git status shows `⇡3`

#### Scenario: Behind by N commits

- **WHEN** the local branch is behind remote by 5 commits
- **THEN** the git status shows `⇣5`

#### Scenario: Diverged branches

- **WHEN** the local branch has diverged (2 ahead, 4 behind)
- **THEN** the git status shows `⇕⇡2⇣4`

#### Scenario: Stash exists

- **WHEN** the git stash has entries
- **THEN** the git status shows `≡`

#### Scenario: Only staged changes

- **WHEN** one file is added to the index and no files are modified in the worktree
- **THEN** the git status renders the index group in green (e.g., `+1`) and renders no worktree group

#### Scenario: Only unstaged changes

- **WHEN** one file is modified in the worktree and the index is empty
- **THEN** the git status renders the worktree group in red (e.g., `~1`) and renders no index group

#### Scenario: Both staged and unstaged changes

- **WHEN** one file is staged and another is modified in the worktree
- **THEN** the git status renders both groups distinctly: an index group in green and a worktree group in red, visually separable

#### Scenario: Untracked files

- **WHEN** there are untracked files in the worktree
- **THEN** the git status renders the `untracked` variable distinct from the index/worktree groups
