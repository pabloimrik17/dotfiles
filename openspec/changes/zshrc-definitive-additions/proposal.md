## Why

The current `dot_zshrc.tmpl` covers tool initialization and basic aliases but is missing everyday productivity shortcuts that compound across hundreds of daily terminal interactions — navigation shorthands, developer-oriented file views, interactive fzf workflows (process killing, code search, git browsing), package-manager aliases for both pnpm and bun, and environment configuration for tools already installed (jq, direnv, bat theming). Additionally, `fd` is used as fzf's backend but is not listed as an explicit dependency, meaning fzf silently degrades if fd is missing.

## What Changes

- Add navigation aliases (`..`, `...`, `....`)
- Add 4 eza developer views: `lla` (full detail + hidden), `ldev` (git-aware, hiding gitignored), `lcode` (clean tree without node_modules/dist/build/.git), `lsize` (sorted by size)
- Add 2 fzf power functions: `fkill` (interactive process killer), `frg` (ripgrep + fzf + bat preview → open in editor)
- Add 2 git+fzf integration functions: `fglog` (browse commit log with diff preview), `fgco` (checkout branch with commit history preview)
- Add 7 pnpm aliases (`pi`, `pd`, `pb`, `pt`, `pa`, `pr`, `px`) and 7 symmetric bun aliases (`bi`, `bd`, `bb`, `bt`, `ba`, `br`, `bx`)
- Add 3 jq aliases (`jqless`, `pretty-json`, `check-json`)
- Add conditional direnv hook (`eval "$(direnv hook zsh)"` guarded by `command -v`)
- Add `export BAT_THEME="Catppuccin Mocha"` for consistent catppuccin theming across bat and delta
- Add `fd` to `BREW_PACKAGES` in `run_once_install-packages.sh.tmpl`
- Add `direnv` to `BREW_PACKAGES` in `run_once_install-packages.sh.tmpl`

## Capabilities

### New Capabilities

- `zsh-aliases`: Defines the full set of shell aliases and interactive functions added to the zshrc — navigation, eza views, package-manager shortcuts (pnpm/bun), jq helpers, and fzf power functions (fkill, frg, fglog, fgco)

### Modified Capabilities

_(none — no existing spec-level requirements change; all additions are new alias/function blocks in `dot_zshrc.tmpl` and new packages in the install script)_

## Impact

- **Files modified**: `dot_zshrc.tmpl` (~30 new lines across 4 new alias/function sections), `run_once_install-packages.sh.tmpl` (2 packages added to `BREW_PACKAGES`)
- **Dependencies**: `fd` (already used implicitly as fzf backend, now explicit), `direnv` (new optional dependency, hook guarded by `command -v`)
- **Interaction with in-flight changes**: No overlap — all additions target new sections below existing alias blocks. `expand-omz-plugins` modifies the plugin array and init lines; `tune-autosuggestions` modifies the autosuggestions block; `inline-fzf-init` modifies the fzf sourcing line. This change appends after all of those.
