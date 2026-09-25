# Delta: gh-dash-keybindings

## ADDED Requirements

### Requirement: PR tuicr review keybinding (direct)

The PR keybindings SHALL include a `z` key that opens the selected PR in tuicr using direct execution. The command SHALL be `cd {{.RepoPath}} && tuicr pr {{.PrNumber}}` and SHALL use only deterministic tokens (no `{{.Title}}`), per the injection rule documented for the AoE bindings. `z` is free: gh-dash binds `e` (expand description) and the other obvious mnemonics as built-ins, and `n` is the second stroke of the built-in `ctrl+s n` (new section), which a custom `n` would shadow because gh-dash dispatches custom keys before section mode; `z`/`Z` is the only unbound lowercase/uppercase pair (verified against gh-dash v4.26.0's key tables and dispatch order).

#### Scenario: tuicr opens for a PR (direct)

- **WHEN** the user presses `z` on a PR
- **THEN** gh-dash suspends its TUI, tuicr opens the PR diff, and quitting tuicr resumes gh-dash where it was

### Requirement: PR tuicr review keybinding (tmux popup)

The PR keybindings SHALL include a `Z` key that opens the selected PR in tuicr inside a tmux popup. The command SHALL use `tmux display-popup -E` with tuicr running in `{{.RepoPath}}`, a size of at least 90% x 90%, and a title carrying `{{.RepoName}}#{{.PrNumber}}`. The working directory SHALL be reached by a `cd` inside the popup payload, not by tmux's `-d` flag: gh-dash renders `{{.RepoPath}}` with an unexpanded `~`, and tmux silently falls back to `$HOME` rather than tilde-expanding a start-directory. As with `z`, gh-dash is suspended while the popup is open: it runs custom commands in the foreground, and `display-popup` does not return until the popup closes. Closing tuicr SHALL close the popup and resume gh-dash with section and selection intact. The popup's gain over a split is a framed, titled, near-full-size view.

#### Scenario: tuicr opens over gh-dash in a popup

- **WHEN** the user presses `Z` on a PR while inside a tmux session
- **THEN** a titled popup opens running `tuicr pr <n>`, and gh-dash stays suspended until it closes

#### Scenario: Closing the popup returns to gh-dash intact

- **WHEN** the user quits tuicr inside the popup
- **THEN** the popup closes and gh-dash resumes on the same section and selection

## MODIFIED Requirements

### Requirement: Lowercase/uppercase pattern for direct/tmux variants

All custom PR keybindings that have both a direct and tmux variant SHALL use lowercase for direct execution and uppercase for the tmux variant of the same action. AoE keybindings SHALL remain exempt: their queue and background lifecycle operations do not take over the terminal and have no tmux variant. Instead, `f` queues or reuses a normal session and `F` starts or resumes a review-team session.

#### Scenario: Pattern is consistent across interactive custom PR keybindings

- **WHEN** inspecting the keybindings config
- **THEN** `b`/`B` (review), `i`/`I` (worktree), `t`/`T` (CI checks), and `z`/`Z` (tuicr review) all follow lowercase=direct and uppercase=tmux

#### Scenario: AoE queue keybindings use the session/review convention

- **WHEN** inspecting the `f` and `F` keybindings
- **THEN** `f` queues or reuses a normal AoE session and `F` starts or resumes an AoE review-team session
- **AND** neither has a tmux variant

### Requirement: Custom keybindings SHALL NOT collide with built-in defaults

No custom keybinding SHALL use a key that is assigned to a built-in gh-dash function in the same view context. Specifically, the following keys are reserved for built-ins:

- Universal/Navigation: `g`, `G`, `j`, `k`, `h`, `l`, `r`, `R`, `s`, `q`, `?`, `/`, `p`, `P`, `o`, `y`, `Y`, `ctrl+c`, `ctrl+d`, `ctrl+u`, and the arrow/`home`/`end` aliases
- PR view: `a`, `A`, `c`, `C`, `d`, `e`, `L`, `m`, `t`, `u`, `v`, `w`, `W`, `x`, `X`, `[`, `]`, `V`, `space`
- Section mode (`ctrl+s` prefix): `n` (`ctrl+s n`, new section) and `x` (`ctrl+s x`, remove section); custom keys dispatch before section mode, so a custom `n` or `x` would shadow them

Known exceptions, pending a separate rebind: the custom universal `L` and prs `t` shadow the built-ins `L` (label) and `t` (toggle smart filtering).

#### Scenario: No collision with navigation defaults

- **WHEN** the config is loaded by gh-dash
- **THEN** the built-in `g` (first item), `G` (last item), `R` (refresh all) navigation keys function as documented

#### Scenario: No collision with PR defaults

- **WHEN** user is in PR view
- **THEN** the built-in `C` (checkout), `W` (mark ready for review) keys function as documented
