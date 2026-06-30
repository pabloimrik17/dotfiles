# gh-dash-keybindings Specification

## Purpose

TBD - created by archiving change fix-ghd-repo-paths. Update Purpose after archive.

## Requirements

### Requirement: All keybindings have a name field

Every keybinding entry in `config.yml` SHALL include a `name` field with a human-readable description so the gh-dash help menu displays meaningful labels.

#### Scenario: Help menu shows keybinding names

- **WHEN** user opens the gh-dash help menu
- **THEN** each custom keybinding displays its `name` value instead of the raw command

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

### Requirement: AoE session queue keybinding

The PR keybindings SHALL include an `f` key that creates the PR's worktree via worktrunk and registers it as an Agent of Empires session WITHOUT launching it (queued for later in the AoE TUI), using direct execution. The command SHALL use `aoe add` without `-l/--launch` so control returns to gh-dash immediately. The session title SHALL use a deterministic token (`pr {{.RepoName}}#{{.PrNumber}}`), NOT the free-text `{{.Title}}`: gh-dash renders the template before invoking the shell, so a PR title containing a single quote could break out of the single-quoted `-x` payload and inject commands.

#### Scenario: PR queued as an AoE session

- **WHEN** user presses `f` on a PR
- **THEN** gh-dash suspends TUI and runs `wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x 'aoe add . -t "pr {{.RepoName}}#{{.PrNumber}}"'`, then resumes TUI without an interactive agent taking the terminal

#### Scenario: Session title is not user-controlled free text

- **WHEN** a PR's title contains a single quote (e.g. `fix don't crash`)
- **THEN** the rendered `f` command does NOT embed `{{.Title}}`, so the title cannot break out of the `-x` shell payload

### Requirement: AoE review-team keybinding

The PR keybindings SHALL include an `F` key that creates the PR's worktree via worktrunk and registers an Agent of Empires review session, launching it immediately with `aoe add -l` (a background start that returns control to gh-dash) so the review runs without waiting to be opened. The session's initial prompt SHALL be the `/review-team` slash command, which spins up a three-agent review team running `/code-review:code-review`, `/code-review`, and `/verify` respectively; the agents SHALL NOT post anything on the PR and SHALL report findings in-session. The review instructions SHALL be passed as a single token (the slash-command name) via `--extra-args`, NOT as an inline multi-word string, because `aoe add` shell-splits `--extra-args` (it is built for flags) and would truncate a multi-word prompt to its first word. The session SHALL be grouped under `reviews/{{.RepoName}}`.

#### Scenario: PR launched as an AoE review team

- **WHEN** user presses `F` on a PR
- **THEN** gh-dash suspends TUI and runs `wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x 'aoe add . -t "review {{.RepoName}}#{{.PrNumber}}" -g "reviews/{{.RepoName}}" -l --extra-args "/review-team {{.RepoName}}#{{.PrNumber}}"'`, which starts the review session in the background and resumes the TUI without an interactive agent taking the terminal

#### Scenario: Review prompt passed as a single-token slash command

- **WHEN** the `F` command is rendered
- **THEN** the review instructions are delivered via the `/review-team` slash command (a single token), not as an inline multi-word prompt that `aoe add --extra-args` would whitespace-split

### Requirement: AoE queue keybindings omit --trust-hooks

The `f` and `F` keybindings SHALL NOT pass `--trust-hooks` to `aoe add`, so a reviewed repository's `.agent-of-empires/` hooks are never auto-executed without confirmation (the `F` binding in particular operates on potentially untrusted PRs).

#### Scenario: Review binding does not auto-trust repo hooks

- **WHEN** user presses `F` on a PR from an untrusted fork
- **THEN** the rendered `aoe add` command does NOT contain `--trust-hooks`

### Requirement: Lowercase/uppercase pattern for direct/tmux variants

All custom PR keybindings that have both a direct and tmux variant SHALL use lowercase for direct execution and uppercase for the tmux variant of the same action. AoE keybindings are exempt from the direct/tmux convention: `aoe add` is non-interactive (a queue, or with `-l` a background start — no terminal takeover), so these bindings have no tmux variant. Instead, `f` queues a plain AoE session and `F` launches an AoE review-team session.

#### Scenario: Pattern is consistent across interactive custom PR keybindings

- **WHEN** inspecting the keybindings config
- **THEN** `b`/`B` (review), `i`/`I` (worktree), and `t`/`T` (CI checks) all follow the lowercase=direct, UPPERCASE=tmux pattern

#### Scenario: AoE queue keybindings use the session/review convention

- **WHEN** inspecting the `f` and `F` keybindings
- **THEN** `f` queues a plain AoE session and `F` launches an AoE review-team session, and neither has a tmux variant
