## Why

We currently use fzf with custom shell functions (`frg`, `fgco`, `fglog`, `fkill`) for fuzzy finding. Television replaces these ad-hoc functions with a declarative TOML channel system, adding contextual autocomplete (Ctrl+T detects the command you are typing and offers the relevant options: branches for `git checkout`, containers for `docker exec`, scripts for `bun run`). Less custom code in .zshrc, more functionality, all configurable.

## What Changes

- Install television via Homebrew
- Create base configuration in `dot_config/television/config.toml`: Catppuccin theme, shell integration (Ctrl+T contextual, Ctrl+R history)
- Configure channel triggers for our stack: git, gh, docker, bun, brew, ssh
- Create a custom `bun-scripts` channel to fuzzy-execute scripts from package.json
- Add `eval "$(tv init zsh)"` initialization to .zshrc
- Evaluate and simplify .zshrc functions that Television replaces (`frg`, `fgco`, `fglog`, `fkill`)

## Capabilities

### New Capabilities

- `television-config`: Television configuration (theme, shell integration, keybindings)
- `television-channels`: Channel triggers and custom channels for the project stack (git, gh, docker, bun, brew)

### Modified Capabilities

- `zsh-config`: Add television initialization and evaluate removing replaced custom fzf functions
- `zsh-aliases`: Possible simplification of fzf-related aliases

## Impact

- **New files:** `dot_config/television/config.toml`, `dot_config/television/cable/bun-scripts.toml`
- **Modified files:** `dot_zshrc.tmpl`, `run_onchange_install-packages.sh.tmpl`
- **New dependencies:** `television` (brew), requires `fd`, `bat`, `rg` (already installed)
- **Risk:** Low-medium. fzf keeps working in parallel. The custom functions can be removed gradually after confirming Television covers them.
