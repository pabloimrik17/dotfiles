## MODIFIED Requirements

### Requirement: PR code review keybinding (direct)

The PR keybindings SHALL include a `b` key that checks out a worktree for the PR and launches Claude with a code review prompt using direct execution.

The command SHALL pass the program to `-x` and its arguments after a `--` separator, rather than
passing a single multi-word string to `-x`. worktrunk treats `-x` as a program plus literal argv, so
a multi-word string is looked up as one executable name and fails. Arguments after `--` are
template-expanded and then POSIX shell-escaped by worktrunk, which also removes the need for the
caller to quote them defensively.

#### Scenario: Code review launches for a PR (direct)

- **WHEN** user presses `b` on a PR
- **THEN** gh-dash suspends TUI and runs `wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x claude -- /code-review:code-review {{.RepoName}}#{{.PrNumber}}`

#### Scenario: No multi-word string is passed to -x

- **WHEN** the `b` command is read
- **THEN** the value immediately following `-x` is a single program name, and every argument for that
  program appears after `--`

### Requirement: PR code review keybinding (tmux)

The PR keybindings SHALL include a `B` key that checks out a worktree for the PR and launches Claude with a code review prompt in a side-by-side tmux pane.

The inner `wt` invocation SHALL use the same program-plus-argv form as the `b` binding.

#### Scenario: Code review launches in tmux pane

- **WHEN** user presses `B` on a PR while inside a tmux session
- **THEN** a horizontal split pane opens running `wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x claude -- /code-review:code-review {{.RepoName}}#{{.PrNumber}}` alongside gh-dash

#### Scenario: tmux variant matches its direct counterpart

- **WHEN** the `b` and `B` commands are compared
- **THEN** the `wt` portion is identical, differing only by the surrounding `tmux split-window`

## ADDED Requirements

### Requirement: Keybinding payloads are verified by invocation, not by inspection

Each PR keybinding that passes a program and arguments through `wt -x` SHALL be verified by actually
pressing the key and observing the launched program receive its arguments. Reading the rendered
command is not sufficient evidence: the payload passes through gh-dash template rendering, then the
shell, then worktrunk's own argument handling and shell-escaping, and a defect in any of those three
layers produces a command that looks correct in the config file.

#### Scenario: Each argv-passing binding is exercised

- **WHEN** the keybinding payloads change
- **THEN** every affected key is pressed against a real PR and the launched program is observed to
  receive its intended arguments

#### Scenario: A broken payload is observable

- **WHEN** a binding's program name and arguments are collapsed into one string
- **THEN** pressing the key surfaces a failure to launch, rather than silently starting the program
  without its arguments
