## MODIFIED Requirements

### Requirement: fkill interactive process killer
The zshrc SHALL define a function `fkill` that uses fzf to interactively select one or more processes and kill them. The default signal SHALL be SIGKILL (9), overridable by passing a signal number as argument. A comment SHALL note this function may be replaced by television's process channel in a future change.

#### Scenario: Kill a process interactively
- **WHEN** user types `fkill`
- **THEN** fzf displays a list of running processes, user selects one or more, and selected processes are killed with signal 9

#### Scenario: Kill with custom signal
- **WHEN** user types `fkill 15`
- **THEN** selected processes are killed with SIGTERM (15) instead of SIGKILL

### Requirement: frg interactive code search
The zshrc SHALL define a function `frg` that pipes ripgrep results through fzf with bat-powered preview, and opens the selected result in `$EDITOR` at the matching line number. If `$EDITOR` is unset, it SHALL fall back to `code`. A comment SHALL note this function may be replaced by television's text channel in a future change.

#### Scenario: Search and open result
- **WHEN** user types `frg "TODO"`
- **THEN** ripgrep searches for "TODO", fzf displays matches with syntax-highlighted preview via bat, and selecting a result opens it in the editor at the matching line

#### Scenario: No matches found
- **WHEN** user types `frg "nonexistent_pattern_xyz"`
- **THEN** ripgrep produces no output and fzf shows an empty list; no editor is opened

### Requirement: fglog interactive git log browser
The zshrc SHALL define a function `fglog` that displays `git log --oneline` through fzf with a preview pane showing the full commit diff via `git show`. A comment SHALL note this function may be replaced by television's git-log channel in a future change.

#### Scenario: Browse commits interactively
- **WHEN** user types `fglog` inside a git repository
- **THEN** fzf displays one-line commit entries with a right-side preview showing the selected commit's full diff

### Requirement: fgco interactive branch checkout
The zshrc SHALL define a function `fgco` that lists all branches (local and remote) through fzf with a commit history preview, and checks out the selected branch. Remote branches SHALL have their `remotes/<origin>/` prefix stripped to create a local tracking branch. A comment SHALL note this function may be replaced by television's git-branch channel in a future change.

#### Scenario: Checkout a local branch
- **WHEN** user types `fgco` and selects a local branch
- **THEN** git checks out that branch

#### Scenario: Checkout a remote branch
- **WHEN** user types `fgco` and selects `remotes/origin/feature-x`
- **THEN** git checks out `feature-x`, creating a local tracking branch
