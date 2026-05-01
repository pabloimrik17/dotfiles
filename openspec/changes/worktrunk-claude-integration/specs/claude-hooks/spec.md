## ADDED Requirements

### Requirement: Worktrunk marker set to working on SessionStart

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include, inside the existing `hooks.SessionStart` block, a command that sets the worktrunk branch marker to `🤖` to indicate Claude is actively working in the current worktree. The command SHALL be guarded so it is a silent no-op when `wt` is not on PATH or when the current directory is not inside a git repository, and it SHALL never block session startup (`|| true`).

#### Scenario: Marker set on session start in a worktrunk-managed repo

- **GIVEN** a directory that is inside a git repository
- **AND** `wt` is on PATH
- **WHEN** Claude Code starts a session in that directory
- **THEN** the SessionStart hook SHALL invoke `wt config state marker set "🤖"` for the current branch
- **AND** running `wt list` SHALL show the `🤖` marker on the row for that branch

#### Scenario: Hook is a no-op outside a git repo

- **GIVEN** Claude Code starts in a directory that is NOT inside a git repository
- **WHEN** the SessionStart hook runs
- **THEN** the marker command SHALL exit 0 without error and without invoking `wt`

#### Scenario: Hook is a no-op when wt is not installed

- **GIVEN** Claude Code starts on a machine where `wt` is not on PATH
- **WHEN** the SessionStart hook runs
- **THEN** the marker command SHALL exit 0 without error
- **AND** Claude Code session startup SHALL proceed normally

#### Scenario: Existing bd prime entry is preserved

- **WHEN** the new marker command is added to the SessionStart hook block
- **THEN** the existing `bd prime` entry in the same block SHALL continue to run
- **AND** both commands SHALL run in the order they appear in the array

### Requirement: Worktrunk marker set to waiting on Stop

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include a `hooks.Stop` block with a command that sets the worktrunk branch marker to `💬` to indicate Claude has finished its turn and is awaiting user input. The command SHALL be guarded the same way as the SessionStart marker (no-op outside git, no-op without `wt`, never blocking).

#### Scenario: Marker set when turn ends

- **GIVEN** Claude Code has finished a response in a worktrunk-managed repository
- **WHEN** the Stop hook fires
- **THEN** the hook SHALL invoke `wt config state marker set "💬"` for the current branch
- **AND** running `wt list` SHALL show the `💬` marker on the row for that branch

#### Scenario: Stop hook present after chezmoi apply

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.claude/settings.json` SHALL contain a `hooks.Stop` array with at least one command entry that runs the marker command described above

#### Scenario: Hook is a no-op outside a git repo

- **GIVEN** Claude Code finishes a turn in a non-git directory
- **WHEN** the Stop hook fires
- **THEN** the marker command SHALL exit 0 without error

### Requirement: Worktrunk marker set to waiting on Notification

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include a `hooks.Notification` block with a command that sets the worktrunk branch marker to `💬` so blocked permission prompts and other notification-triggering events surface in `wt list`. Guarding behaviour SHALL match the Stop hook.

#### Scenario: Marker set when notification fires

- **GIVEN** Claude Code emits a notification (e.g. permission prompt)
- **WHEN** the Notification hook runs
- **THEN** the hook SHALL invoke `wt config state marker set "💬"` for the current branch

#### Scenario: Notification hook present after chezmoi apply

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.claude/settings.json` SHALL contain a `hooks.Notification` array with at least one command entry that runs the marker command
