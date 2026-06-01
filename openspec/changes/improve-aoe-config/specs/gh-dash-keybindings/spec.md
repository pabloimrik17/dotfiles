## ADDED Requirements

### Requirement: AoE session queue keybinding

The PR keybindings SHALL include an `f` key that creates the PR's worktree via worktrunk and registers it as an Agent of Empires session WITHOUT launching it (queued for later in the AoE TUI), using direct execution. The command SHALL use `aoe add` without `-l/--launch` so control returns to gh-dash immediately.

#### Scenario: PR queued as an AoE session

- **WHEN** user presses `f` on a PR
- **THEN** gh-dash suspends TUI and runs `wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x 'aoe add . -t "{{.Title}}"'`, then resumes TUI without an interactive agent taking the terminal

### Requirement: AoE review-team queue keybinding

The PR keybindings SHALL include an `F` key that creates the PR's worktree via worktrunk and registers an Agent of Empires session WITHOUT launching it, whose initial prompt instructs the agent to spin up a three-agent review team. The three agents SHALL run `/code-review:code-review`, `/code-review`, and `/verify` respectively, SHALL NOT post anything on the PR, and SHALL report findings in-session. The session SHALL be grouped under `reviews/{{.RepoName}}`.

#### Scenario: PR queued as an AoE review team

- **WHEN** user presses `F` on a PR
- **THEN** gh-dash suspends TUI and runs `wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x 'aoe add . -t "review {{.RepoName}}#{{.PrNumber}}" -g "reviews/{{.RepoName}}" --extra-args' -- "<three-agent review prompt>"`, then resumes TUI without an interactive agent taking the terminal

### Requirement: AoE queue keybindings omit --trust-hooks

The `f` and `F` keybindings SHALL NOT pass `--trust-hooks` to `aoe add`, so a reviewed repository's `.agent-of-empires/` hooks are never auto-executed without confirmation (the `F` binding in particular operates on potentially untrusted PRs).

#### Scenario: Review binding does not auto-trust repo hooks

- **WHEN** user presses `F` on a PR from an untrusted fork
- **THEN** the rendered `aoe add` command does NOT contain `--trust-hooks`

## MODIFIED Requirements

### Requirement: Lowercase/uppercase pattern for direct/tmux variants

All custom PR keybindings that have both a direct and tmux variant SHALL use lowercase for direct execution and uppercase for the tmux variant of the same action. AoE queue keybindings are exempt from the direct/tmux convention: `aoe add` returns immediately (non-interactive, no terminal takeover), so these bindings have no tmux variant. Instead, `f` queues a plain AoE session and `F` queues an AoE review-team session.

#### Scenario: Pattern is consistent across interactive custom PR keybindings

- **WHEN** inspecting the keybindings config
- **THEN** `b`/`B` (review), `i`/`I` (worktree), and `t`/`T` (CI checks) all follow the lowercase=direct, UPPERCASE=tmux pattern

#### Scenario: AoE queue keybindings use the session/review convention

- **WHEN** inspecting the `f` and `F` keybindings
- **THEN** `f` queues a plain AoE session and `F` queues an AoE review-team session, and neither has a tmux variant
