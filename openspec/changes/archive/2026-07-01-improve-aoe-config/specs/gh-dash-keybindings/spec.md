## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Lowercase/uppercase pattern for direct/tmux variants

All custom PR keybindings that have both a direct and tmux variant SHALL use lowercase for direct execution and uppercase for the tmux variant of the same action. AoE keybindings are exempt from the direct/tmux convention: `aoe add` is non-interactive (a queue, or with `-l` a background start — no terminal takeover), so these bindings have no tmux variant. Instead, `f` queues a plain AoE session and `F` launches an AoE review-team session.

#### Scenario: Pattern is consistent across interactive custom PR keybindings

- **WHEN** inspecting the keybindings config
- **THEN** `b`/`B` (review), `i`/`I` (worktree), and `t`/`T` (CI checks) all follow the lowercase=direct, UPPERCASE=tmux pattern

#### Scenario: AoE queue keybindings use the session/review convention

- **WHEN** inspecting the `f` and `F` keybindings
- **THEN** `f` queues a plain AoE session and `F` launches an AoE review-team session, and neither has a tmux variant
