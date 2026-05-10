## ADDED Requirements

### Requirement: wsh function for detached worktree+claude handoff

The zshrc SHALL define a `wsh` shell function that takes a branch name as the first argument and an optional initial prompt as remaining arguments, and spawns a detached `tmux` session whose body runs `wt switch --create <branch> --execute=claude`, forwarding the prompt to Claude when supplied. The function SHALL print an attach hint (`tmux attach -t <branch>`) on successful spawn and SHALL print a usage message and return non-zero when invoked without a branch.

#### Scenario: Spawns detached session with no prompt

- **GIVEN** `tmux` and `wt` are on PATH
- **WHEN** the user types `wsh feat-x`
- **THEN** a detached tmux session named `feat-x` SHALL exist
- **AND** the session's first window SHALL be running `wt switch --create feat-x --execute=claude`
- **AND** the calling shell SHALL receive its prompt back without blocking

#### Scenario: Forwards initial prompt to claude

- **GIVEN** `tmux` and `wt` are on PATH
- **WHEN** the user types `wsh feat-y "summarise the codebase"`
- **THEN** the spawned tmux session SHALL run `wt switch --create feat-y --execute=claude -- 'summarise the codebase'`

#### Scenario: Prints attach hint on success

- **WHEN** `wsh` successfully spawns a session
- **THEN** the function SHALL print a line containing `tmux attach -t <branch>` to stdout

#### Scenario: Prints usage on missing branch

- **WHEN** the user types `wsh` with no arguments
- **THEN** the function SHALL print a usage line to stderr starting with `usage: wsh`
- **AND** SHALL return a non-zero exit code

#### Scenario: Function available after chezmoi apply

- **WHEN** the user runs `chezmoi apply` and starts a new shell
- **THEN** `type wsh` SHALL report `wsh is a shell function`
