## Why

The dotfiles already include `gh-dash` for managing PRs, issues, and notifications from the terminal. However, monitoring CI/GitHub Actions still requires switching to the browser or running `gh run view` manually. `gh-enhance` is a companion TUI from the same author (dlvhdr) that fills this gap — it shows action runs, jobs, and logs for a PR, supports rerunning flaky jobs (`Ctrl+R`), and auto-watches in-progress runs. Integrating it into the dotfiles completes the terminal-first GitHub workflow.

GitHub issue: pabloimrik17/dotfiles#105

## What Changes

- Install `gh-enhance` as a `gh` CLI extension via the chezmoi install script (alongside existing `gh-dash`)
- Add `ghe` shell alias that invokes `gh enhance` with the Catppuccin Mocha theme pre-set
- Add two keybindings in `gh-dash` config to launch ENHANCE from the PR view:
    - `T` — opens in a tmux split pane (non-blocking)
    - `t` — opens inline (replaces gh-dash temporarily, returns on exit)
- No new config file — ENHANCE has no `config.yml`; theming is via env var, keybindings are built-in

## Capabilities

### New Capabilities

- `gh-enhance-install`: Installation of gh-enhance extension and shell alias via chezmoi
- `gh-enhance-integration`: Keybindings in gh-dash config to launch ENHANCE from PR view (tmux and inline variants)

### Modified Capabilities

_None — this is a new tool addition with no changes to existing specs._

## Impact

- **Files modified**: `run_onchange_install-packages.sh.tmpl` (add gh-enhance to extensions group), `dot_zshrc.tmpl` (add `ghe` alias), `dot_config/gh-dash/config.yml` (add `T` and `t` keybindings)
- **Dependencies**: `gh` CLI (already installed), `gh-dash` extension (already installed), tmux (already installed, required only for `T` keybinding)
- **No new config files** — ENHANCE uses env vars, not a config file
- **No breaking changes** to existing configuration
