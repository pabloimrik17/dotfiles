## Why

The current zsh config only uses 5 oh-my-zsh plugins while manually initializing several tools (nvm, gh, bun) with synchronous `eval`/`source` calls. This misses useful productivity plugins available out-of-the-box and leaves ~300-700ms of avoidable startup time on the table (primarily nvm). Expanding the plugin set and migrating manual init to plugin equivalents makes the shell faster, more productive, and easier to maintain.

## What Changes

- Add 21 new oh-my-zsh plugins across three categories:
    - **Tool completions/aliases**: `brew`, `docker-compose`, `macos`
    - **Productivity utilities**: `sudo`, `extract`, `encode64`, `jsontools`, `copypath`, `copyfile`, `copybuffer`, `colored-man-pages`, `safe-paste`, `fancy-ctrl-z`, `bgnotify`, `aliases`, `web-search`, `urltools`, `history`, `gitignore`
    - **Runtime completions**: `nvm`, `gh`, `bun`
- Migrate nvm initialization from manual `source nvm.sh` to the `nvm` plugin with lazy loading (`zstyle ':omz:plugins:nvm' lazy yes`), eliminating ~300-700ms startup penalty
- Migrate gh completions from synchronous `eval "$(gh completion -s zsh)"` to the `gh` plugin (async background caching)
- Migrate bun completions from manual `source ~/.bun/_bun` to the `bun` plugin (async background caching)
- Remove the manual init lines replaced by plugins (nvm source + bash_completion, gh eval, bun source)
- Add `zstyle` configuration lines for nvm plugin before oh-my-zsh is sourced
- Retain all manual config that plugins do NOT cover (NVM_DIR export, pnpm PATH, BUN_INSTALL + PATH, starship, zoxide, fzf, atuin, autosuggestions, syntax-highlighting, all custom aliases)

## Capabilities

### New Capabilities

- `omz-plugins`: Defines which oh-my-zsh plugins are enabled, their configuration (zstyle settings), and the rationale for each plugin's inclusion or exclusion

### Modified Capabilities

_(none -- no existing spec-level behavior changes)_

## Impact

- **File modified**: `dot_zshrc.tmpl` -- plugin array expansion, zstyle additions, removal of 4 manual init lines
- **Shell startup time**: Expected reduction from ~450-850ms to ~120-150ms due to nvm lazy loading and async gh/bun completions
- **First-use latency**: First invocation of `node`/`npm`/`pnpm`/`yarn` in a session will incur a one-time ~300ms delay (nvm lazy load)
- **Dependencies**: All 21 plugins are bundled with oh-my-zsh (no new installs required). `bgnotify` benefits from `terminal-notifier` on macOS (optional)
- **Interaction with in-flight changes**: The `inline-fzf-init` change modifies fzf sourcing in `dot_zshrc.tmpl` but does not touch the plugin array or the lines this change modifies -- no conflict expected
