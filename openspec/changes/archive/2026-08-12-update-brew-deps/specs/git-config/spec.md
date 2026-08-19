# git-config Delta

## MODIFIED Requirements

### Requirement: Curated git aliases

The gitconfig SHALL define exactly these aliases:

- `lg` = graph log with color formatting, abbreviated commits, and `--graph-lane-limit=8` (git ≥2.55) so wide commit graphs are truncated to at most 8 lanes
- `last` = `log -1 HEAD --stat`
- `unstage` = `reset HEAD --`
- `undo` = `reset --soft HEAD~1`
- `amend` = `commit --amend --no-edit`
- `branches` = `branch -a`
- `remotes` = `remote -v`

The gitconfig SHALL NOT include shorthand aliases (`st`, `co`, `ci`, `cm`, `ca`, `br`, `df`, `dc`) as these are provided by the OMZ git plugin.

#### Scenario: Git lg shows graph

- **WHEN** `git lg` is run in a repository with commits
- **THEN** a colored graph log with abbreviated hashes, branch names, relative dates, and author names is displayed

#### Scenario: Git lg caps graph lanes

- **WHEN** `git lg` is run in a repository whose history would render more than 8 parallel graph lanes
- **THEN** the graph is truncated to 8 lanes instead of widening unbounded

#### Scenario: Git unstage removes from index

- **WHEN** `git unstage <file>` is run
- **THEN** the file is removed from the staging area but remains in the working tree

#### Scenario: Git amend adds to last commit

- **WHEN** staged changes exist and `git amend` is run
- **THEN** the staged changes are added to the previous commit without changing its message
