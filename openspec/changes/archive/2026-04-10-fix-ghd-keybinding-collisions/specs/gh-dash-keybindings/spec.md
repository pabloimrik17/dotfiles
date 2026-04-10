## MODIFIED Requirements

### Requirement: Universal lazygit keybinding

The universal keybindings SHALL include an `L` key that opens lazygit in the repo directory using direct execution (no tmux).

#### Scenario: Lazygit opens in repo directory

- **WHEN** user presses `L` on any item
- **THEN** gh-dash suspends TUI, runs `cd {{.RepoPath}} && lazygit`, and resumes TUI on exit

### Requirement: PR code review keybinding (direct)

The PR keybindings SHALL include a `b` key that checks out a worktree for the PR and launches Claude with a code review prompt using direct execution.

#### Scenario: Code review launches for a PR (direct)

- **WHEN** user presses `b` on a PR
- **THEN** gh-dash suspends TUI and runs `wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x "claude /code-review:code-review {{.RepoName}}#{{.PrNumber}}"`

### Requirement: PR worktree + Claude keybinding (direct)

The PR keybindings SHALL include an `i` key that checks out a worktree for the PR and launches Claude without a specific prompt using direct execution.

#### Scenario: Claude opens in PR worktree (direct)

- **WHEN** user presses `i` on a PR
- **THEN** gh-dash suspends TUI and runs `wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x claude`

### Requirement: PR code review keybinding (tmux)

The PR keybindings SHALL include a `B` key that checks out a worktree for the PR and launches Claude with a code review prompt in a side-by-side tmux pane.

#### Scenario: Code review launches in tmux pane

- **WHEN** user presses `B` on a PR while inside a tmux session
- **THEN** a horizontal split pane opens running `wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x "claude /code-review:code-review {{.RepoName}}#{{.PrNumber}}"` alongside gh-dash

### Requirement: PR worktree + Claude keybinding (tmux)

The PR keybindings SHALL include an `I` key that checks out a worktree for the PR and launches Claude without a specific prompt in a side-by-side tmux pane.

#### Scenario: Claude opens in tmux pane

- **WHEN** user presses `I` on a PR while inside a tmux session
- **THEN** a horizontal split pane opens running `wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x claude` alongside gh-dash

### Requirement: RepoPath passed to worktrunk via -C flag

All keybinding commands that use `wt` SHALL pass `-C {{.RepoPath}}` to specify the target repository directory.

#### Scenario: wt receives correct repo path

- **WHEN** user presses `b`, `i`, `B`, or `I` on a PR from repo `owner/my-repo`
- **THEN** the command includes `-C {{.RepoPath}}` where `{{.RepoPath}}` resolves to the local repo path

## ADDED Requirements

### Requirement: Custom keybindings SHALL NOT collide with built-in defaults

No custom keybinding SHALL use a key that is assigned to a built-in gh-dash function in the same view context. Specifically, the following keys are reserved for built-ins:

- Universal/Navigation: `g`, `G`, `j`, `k`, `h`, `l`, `r`, `R`, `s`, `q`, `?`, `/`, `p`, `o`, `y`, `Y`
- PR view: `a`, `A`, `c`, `C`, `d`, `e`, `m`, `u`, `v`, `w`, `W`, `x`, `X`, `[`, `]`

#### Scenario: No collision with navigation defaults

- **WHEN** the config is loaded by gh-dash
- **THEN** the built-in `g` (first item), `G` (last item), `R` (refresh all) navigation keys function as documented

#### Scenario: No collision with PR defaults

- **WHEN** user is in PR view
- **THEN** the built-in `C` (checkout), `W` (mark ready for review) keys function as documented

### Requirement: Lowercase/uppercase pattern for direct/tmux variants

All custom PR keybindings that have both a direct and tmux variant SHALL use lowercase for direct execution and uppercase for the tmux variant of the same action.

#### Scenario: Pattern is consistent across all custom PR keybindings

- **WHEN** inspecting the keybindings config
- **THEN** `b`/`B` (review), `i`/`I` (worktree), and `t`/`T` (CI checks) all follow the lowercase=direct, UPPERCASE=tmux pattern
