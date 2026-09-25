# Delta: gh-dash-keybindings

## ADDED Requirements

### Requirement: PR tuicr review keybinding (direct)

The PR keybindings SHALL include a `z` key that opens the selected PR in tuicr using direct execution. The command SHALL be `cd {{.RepoPath}} && tuicr pr {{.PrNumber}}` and SHALL use only deterministic tokens (no `{{.Title}}`), per the injection rule documented for the AoE bindings. `z` is free: gh-dash binds `e` (expand description) and the other obvious mnemonics as built-ins, and `n` is the second stroke of the built-in `ctrl+s n` (new section), which a custom `n` would shadow because gh-dash dispatches custom keys before section mode; `z`/`Z` is the only unbound lowercase/uppercase pair (verified against gh-dash v4.26.0's key tables and dispatch order).

#### Scenario: tuicr opens for a PR (direct)

- **WHEN** the user presses `z` on a PR
- **THEN** gh-dash suspends its TUI, tuicr opens the PR diff, and quitting tuicr resumes gh-dash where it was

### Requirement: PR tuicr review keybinding (tmux popup)

The PR keybindings SHALL include a `Z` key that opens the selected PR in tuicr inside a tmux overlay popup. The command SHALL use `tmux display-popup -E` with tuicr running in `{{.RepoPath}}`, a size of at least 90% x 90%, and a title carrying `{{.RepoName}}#{{.PrNumber}}`. The working directory SHALL be reached by a `cd` inside the popup payload, not by tmux's `-d` flag: gh-dash renders `{{.RepoPath}}` with an unexpanded `~`, and tmux silently falls back to `$HOME` rather than tilde-expanding a start-directory. Closing tuicr SHALL close the popup, leaving the gh-dash pane untouched (section, cursor, and scroll preserved — gh-dash keeps running under the popup).

#### Scenario: tuicr opens over gh-dash in a popup

- **WHEN** the user presses `Z` on a PR while inside a tmux session
- **THEN** a popup overlay opens running `tuicr pr <n>` on top of gh-dash

#### Scenario: Closing the popup returns to gh-dash intact

- **WHEN** the user quits tuicr inside the popup
- **THEN** the popup closes and gh-dash is exactly where it was, without refetching or losing selection
