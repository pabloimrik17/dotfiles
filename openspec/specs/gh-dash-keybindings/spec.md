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

The PR keybindings SHALL include an `f` key that uses the shared gh-dash/AoE integration to locate or create the PR's worktree via Worktrunk and register or reuse its normal AoE session without launching it. The operation SHALL use direct execution and return to gh-dash without attaching to the AoE TUI. Grouping, naming and reuse SHALL follow `ghd-aoe-sessions`. The rendered command SHALL pass repository identity, PR number and repository path without embedding free-text PR titles or descriptions.

#### Scenario: PR queued as an AoE session

- **WHEN** the user presses `f` on a PR
- **THEN** the shared integration obtains the PR worktree through Worktrunk using the repository path
- **AND** it queues or reuses the normal session and returns to gh-dash without launching an agent

#### Scenario: Session title is not user-controlled free text

- **WHEN** a PR title contains a single quote, such as `fix don't crash`
- **THEN** the rendered `f` command does not embed `{{.Title}}`
- **AND** PR metadata is retrieved and handled as data by the shared integration

### Requirement: AoE review-team keybinding

The PR keybindings SHALL include an `F` key that uses the shared integration to locate or create the PR worktree through Worktrunk and register, start or reuse its AoE review session in the background. Grouping and the `Review - <base title>` name SHALL follow `ghd-aoe-sessions`. The initial instruction SHALL be `/review-team owner/repo#N`, invoking the existing three reviewers (`/code-review:code-review`, `/code-review` and `/verify`); they SHALL report in-session and SHALL NOT post to the PR. An existing stopped review SHALL resume without repeating that initial instruction.

#### Scenario: PR launched as an AoE review team

- **WHEN** the user presses `F` on a PR without a review session
- **THEN** the review session is registered with the selected project group and review title
- **AND** it starts in the background while control returns to gh-dash without an interactive attachment

#### Scenario: Review prompt passed as a single-token slash command

- **WHEN** the review starts for the first time
- **THEN** the existing `/review-team` command receives `owner/repo#N` for the selected PR
- **AND** its instructions are not replaced with an inline copy in the keybinding

#### Scenario: Repeated review shortcut

- **WHEN** the user presses `F` again for the same PR
- **THEN** the corresponding review session is reused
- **AND** a running review is left alone or a stopped review resumes its conversation without another `/review-team` submission

### Requirement: AoE queue keybindings omit --trust-hooks

The `f` and `F` keybindings and the shared commands they invoke SHALL NOT pass `--trust-hooks` to AoE, so repositories reviewed through these shortcuts do not acquire automatic hook or project-MCP trust.

#### Scenario: Review binding does not auto-trust repo hooks

- **WHEN** the user presses `F` on a PR from an untrusted fork
- **THEN** neither the rendered command nor its delegated AoE invocations contain `--trust-hooks`

### Requirement: Lowercase/uppercase pattern for direct/tmux variants

All custom PR keybindings that have both a direct and tmux variant SHALL use lowercase for direct execution and uppercase for the tmux variant of the same action. AoE keybindings SHALL remain exempt: their queue and background lifecycle operations do not take over the terminal and have no tmux variant. Instead, `f` queues or reuses a normal session and `F` starts or resumes a review-team session.

#### Scenario: Pattern is consistent across interactive custom PR keybindings

- **WHEN** inspecting the keybindings config
- **THEN** `b`/`B` (review), `i`/`I` (worktree), and `t`/`T` (CI checks) all follow lowercase=direct and uppercase=tmux

#### Scenario: AoE queue keybindings use the session/review convention

- **WHEN** inspecting the `f` and `F` keybindings
- **THEN** `f` queues or reuses a normal AoE session and `F` starts or resumes an AoE review-team session
- **AND** neither has a tmux variant
