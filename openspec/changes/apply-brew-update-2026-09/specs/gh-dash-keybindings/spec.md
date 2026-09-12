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

### Requirement: AoE session queue keybinding

The PR keybindings SHALL include an `f` key that creates the PR's worktree via worktrunk and registers it as an Agent of Empires session WITHOUT launching it (queued for later in the AoE TUI), using direct execution. The command SHALL use `aoe add` without `-l/--launch` so control returns to gh-dash immediately. The session title SHALL use a deterministic token (`pr {{.RepoName}}#{{.PrNumber}}`), NOT the free-text `{{.Title}}`: gh-dash renders the template before invoking the shell, so a PR title containing a single quote could break out of the payload and inject commands.

The command SHALL pass `aoe` to `-x` and every `aoe` argument after a `--` separator, rather than
wrapping the whole `aoe` invocation in a quoted string.

#### Scenario: PR queued as an AoE session

- **WHEN** user presses `f` on a PR
- **THEN** gh-dash suspends TUI and runs `wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x aoe -- add . -t "pr {{.RepoName}}#{{.PrNumber}}"`, then resumes TUI without an interactive agent taking the terminal

#### Scenario: Session title is not user-controlled free text

- **WHEN** a PR's title contains a single quote (e.g. `fix don't crash`)
- **THEN** the rendered `f` command does NOT embed `{{.Title}}`, so the title cannot break out of the payload

#### Scenario: Title stays one argument

- **WHEN** the `f` command runs
- **THEN** the multi-word title reaches `aoe` as a single `-t` argument rather than being split across
  arguments

### Requirement: AoE review-team keybinding

The PR keybindings SHALL include an `F` key that creates the PR's worktree via worktrunk and registers an Agent of Empires review session, launching it immediately with `aoe add -l` (a background start that returns control to gh-dash) so the review runs without waiting to be opened. The session's initial prompt SHALL be the `/review-team` slash command, which spins up a three-agent review team running `/code-review:code-review`, `/code-review`, and `/verify` respectively; the agents SHALL NOT post anything on the PR and SHALL report findings in-session. The review instructions SHALL be passed as a single token (the slash-command name) via `--extra-args`, NOT as an inline multi-word string, because `aoe add` shell-splits `--extra-args` (it is built for flags) and would truncate a multi-word prompt to its first word. The session SHALL be grouped under `reviews/{{.RepoName}}`.

The command SHALL pass `aoe` to `-x` and every `aoe` argument after a `--` separator. This is the
longest of the four payloads and therefore the one most exposed to worktrunk's change from shell
string to literal argv.

#### Scenario: PR launched as an AoE review team

- **WHEN** user presses `F` on a PR
- **THEN** gh-dash suspends TUI and runs `wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x aoe -- add . -t "review {{.RepoName}}#{{.PrNumber}}" -g "reviews/{{.RepoName}}" -l --extra-args "/review-team {{.RepoName}}#{{.PrNumber}}"`, which starts the review session in the background and resumes the TUI without an interactive agent taking the terminal

#### Scenario: Review prompt passed as a single-token slash command

- **WHEN** the `F` command is rendered
- **THEN** the review instructions are delivered via the `/review-team` slash command (a single token), not as an inline multi-word prompt that `aoe add --extra-args` would whitespace-split

#### Scenario: Flags after the separator reach aoe, not wt

- **WHEN** the `F` command runs
- **THEN** `-g`, `-l`, and `--extra-args` are delivered to `aoe`, not consumed by `wt` as its own
  options

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
