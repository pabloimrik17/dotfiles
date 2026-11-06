## MODIFIED Requirements

### Requirement: Universal lazygit keybinding

The universal keybindings SHALL include a `J` key that opens lazygit in the repo directory using direct execution (no tmux).

#### Scenario: Lazygit opens in repo directory

- **WHEN** user presses `J` on any item
- **THEN** gh-dash suspends TUI, runs `cd {{.RepoPath}} && lazygit`, and resumes TUI on exit

### Requirement: Custom keybindings SHALL NOT collide with built-in defaults

No custom keybinding SHALL use a key that is assigned to a built-in gh-dash function in the same view context. Specifically, the following keys are reserved for built-ins:

- Universal/Navigation: `g`, `G`, `j`, `k`, `h`, `l`, `r`, `R`, `q`, `?`, `/`, `p`, `P`, `o`, `y`, `Y`, `ctrl+c`, `ctrl+d`, `ctrl+u`, `ctrl+s`, and the arrow/`home`/`end` aliases
- PR view: `a`, `A`, `c`, `C`, `d`, `e`, `L`, `m`, `s`, `t`, `u`, `v`, `w`, `W`, `x`, `X`, `[`, `]`, `V`, `space`
- Section mode (`ctrl+s` prefix): `n` (`ctrl+s n`, new section) and `x` (`ctrl+s x`, remove section); custom keys dispatch before section mode, so a custom `n` or `x` would shadow them

The custom bindings SHALL leave `t` (toggle smart filtering) and `L` (label) available to the built-ins. CI checks use `i`/`I` (direct/tmux), and lazygit uses universal `J`; their commands SHALL remain unchanged when rebinding.

These choices were verified against gh-dash v4.26.2 (the installed binary reports `version dev` with module version `v4.26.2`): [`keys.go`](https://github.com/dlvhdr/gh-dash/blob/v4.26.2/internal/tui/keys/keys.go), [`prKeys.go`](https://github.com/dlvhdr/gh-dash/blob/v4.26.2/internal/tui/keys/prKeys.go), and the adjacent `issueKeys.go`, `branchKeys.go`, and `notificationKeys.go` tables. `J` is free across those views; `i`/`I` are also free when PR actions are available inside notifications. The [`ui.go` dispatch order](https://github.com/dlvhdr/gh-dash/blob/v4.26.2/internal/tui/ui.go) checks custom commands before section mode, so `n` and `x` remain reserved as second strokes. Recheck these tables when changing bindings or upgrading gh-dash.

#### Scenario: No collision with navigation defaults

- **WHEN** the config is loaded by gh-dash
- **THEN** the built-in `g` (first item), `G` (last item), `R` (refresh all) navigation keys function as documented

#### Scenario: No collision with PR defaults

- **WHEN** user is in PR view
- **THEN** the built-in `C` (checkout), `W` (mark ready for review), `t` (toggle smart filtering), and `L` (label) keys function as documented

### Requirement: Lowercase/uppercase pattern for direct/tmux variants

All custom PR keybindings that have both a direct and tmux variant SHALL use lowercase for direct execution and uppercase for the tmux variant of the same action. AoE keybindings SHALL remain exempt: their queue and background lifecycle operations do not take over the terminal and have no tmux variant. Instead, `f` queues or reuses a normal session and `F` starts or resumes a review-team session.

#### Scenario: Pattern is consistent across interactive custom PR keybindings

- **WHEN** inspecting the keybindings config
- **THEN** `i`/`I` (CI checks) and `z`/`Z` (tuicr review) follow lowercase=direct and uppercase=tmux

#### Scenario: AoE queue keybindings use the session/review convention

- **WHEN** inspecting the `f` and `F` keybindings
- **THEN** `f` queues or reuses a normal AoE session and `F` starts or resumes an AoE review-team session
- **AND** neither has a tmux variant

### Requirement: PR tuicr review keybinding (direct)

The PR keybindings SHALL include a `z` key that opens the selected PR in tuicr using direct execution. The command SHALL be `cd {{.RepoPath}} && tuicr pr {{.PrNumber}}` and SHALL use only deterministic tokens (no `{{.Title}}`), per the injection rule documented for the AoE bindings. `z` is free: gh-dash binds `e` (expand description) and the other obvious mnemonics as built-ins, and `n` is the second stroke of the built-in `ctrl+s n` (new section), which a custom `n` would shadow because gh-dash dispatches custom keys before section mode; `z`/`Z` remains an unbound lowercase/uppercase pair in gh-dash v4.26.2. The retired Claude bindings leave `i`/`I` available for CI checks.

#### Scenario: tuicr opens for a PR (direct)

- **WHEN** the user presses `z` on a PR
- **THEN** gh-dash suspends its TUI, tuicr opens the PR diff, and quitting tuicr resumes gh-dash where it was
