## ADDED Requirements

### Requirement: All keybindings have a name field

Every keybinding entry in `config.yml` SHALL include a `name` field with a human-readable description so the gh-dash help menu displays meaningful labels.

#### Scenario: Help menu shows keybinding names

- **WHEN** user opens the gh-dash help menu
- **THEN** each custom keybinding displays its `name` value instead of the raw command

### Requirement: Universal lazygit keybinding

The universal keybindings SHALL include a `g` key that opens lazygit in the repo directory using direct execution (no tmux).

#### Scenario: Lazygit opens in repo directory

- **WHEN** user presses `g` on any item
- **THEN** gh-dash suspends TUI, runs `cd {{.RepoPath}} && lazygit`, and resumes TUI on exit

### Requirement: PR code review keybinding (direct)

The PR keybindings SHALL include a `C` key that checks out a worktree for the PR and launches Claude with a code review prompt using direct execution.

#### Scenario: Code review launches for a PR (direct)

- **WHEN** user presses `C` on a PR
- **THEN** gh-dash suspends TUI and runs `wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x "claude /code-review:code-review {{.RepoName}}#{{.PrNumber}}"`

### Requirement: PR worktree + Claude keybinding (direct)

The PR keybindings SHALL include a `W` key that checks out a worktree for the PR and launches Claude without a specific prompt using direct execution.

#### Scenario: Claude opens in PR worktree (direct)

- **WHEN** user presses `W` on a PR
- **THEN** gh-dash suspends TUI and runs `wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x claude`

### Requirement: PR code review keybinding (tmux)

The PR keybindings SHALL include an `R` key that checks out a worktree for the PR and launches Claude with a code review prompt in a new tmux window.

#### Scenario: Code review launches in tmux window

- **WHEN** user presses `R` on a PR while inside a tmux session
- **THEN** a new tmux window opens running `wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x "claude /code-review:code-review {{.RepoName}}#{{.PrNumber}}"`

### Requirement: PR worktree + Claude keybinding (tmux)

The PR keybindings SHALL include an `E` key that checks out a worktree for the PR and launches Claude without a specific prompt in a new tmux window.

#### Scenario: Claude opens in tmux window

- **WHEN** user presses `E` on a PR while inside a tmux session
- **THEN** a new tmux window opens running `wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x claude`

### Requirement: Tmux keybindings use descriptive window names

Tmux variant keybindings SHALL set the tmux window name to `PR-{{.PrNumber}}` for easy identification.

#### Scenario: Tmux window has PR number in name

- **WHEN** user presses `R` or `E` on PR #42
- **THEN** the new tmux window is named `PR-42`

### Requirement: RepoPath passed to worktrunk via -C flag

All keybinding commands that use `wt` SHALL pass `-C {{.RepoPath}}` to specify the target repository directory.

#### Scenario: wt receives correct repo path

- **WHEN** user presses `C`, `W`, `R`, or `E` on a PR from repo `owner/my-repo`
- **THEN** the command includes `-C {{.RepoPath}}` where `{{.RepoPath}}` resolves to the local repo path
