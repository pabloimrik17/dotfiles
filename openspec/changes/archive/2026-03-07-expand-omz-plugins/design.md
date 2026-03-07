## Context

The shell config (`dot_zshrc.tmpl`) has two initialization paths: oh-my-zsh plugins (declarative, managed by the framework) and manual `eval`/`source` blocks (imperative, hand-maintained). Currently 5 plugins are declared while nvm, gh, and bun are initialized manually with synchronous calls. The nvm synchronous load is the single largest startup bottleneck (~300-700ms). The file is a chezmoi template targeting macOS (arm64/x86) and Linux.

## Goals / Non-Goals

**Goals:**

- Expand the oh-my-zsh plugin array from 5 to 27 plugins
- Migrate nvm, gh, and bun initialization from manual code to their oh-my-zsh plugin equivalents
- Enable nvm lazy loading to eliminate the startup bottleneck
- Remove manual init lines that become redundant after plugin migration
- Maintain identical runtime behavior (same completions, same tools available)

**Non-Goals:**

- Changing custom aliases (eza, bat, zoxide, ripgrep, git, gh shortcuts) -- these stay manual because they use customized flags the plugins don't offer
- Modifying fzf configuration (covered by the `inline-fzf-init` change)
- Modifying zsh-autosuggestions/syntax-highlighting sourcing (covered by `tune-autosuggestions` change)
- Adding any tools not already installed via Homebrew
- Changing starship, zoxide, or atuin initialization (no plugin equivalents that improve on the current approach)

## Decisions

### D1: Use nvm plugin with lazy mode instead of manual source

**Choice**: Replace lines 30-32 with the `nvm` plugin + `zstyle ':omz:plugins:nvm' lazy yes`

**Rationale**: The nvm plugin's lazy mode creates lightweight wrapper functions for `node`, `npm`, `npx`, `pnpm`, `pnpx`, `yarn`, and `corepack`. The real `nvm.sh` is only sourced on first invocation of any of these commands. This eliminates ~300-700ms from every shell startup at the cost of a one-time ~300ms delay on first use per session.

**Alternative considered**: `zstyle ':omz:plugins:nvm' lazy no` (eager load, same as current behavior) -- rejected because it preserves the startup penalty with no benefit.

**Configuration** (placed before `source $ZSH/oh-my-zsh.sh`):

```zsh
export NVM_DIR="$HOME/.nvm"
zstyle ':omz:plugins:nvm' lazy yes
zstyle ':omz:plugins:nvm' autoload yes
zstyle ':omz:plugins:nvm' silent-autoload yes
```

The `autoload` setting makes nvm automatically switch versions when entering a directory with `.nvmrc`. The `silent-autoload` suppresses the version switch output to keep the terminal clean.

The `export NVM_DIR` line is retained because the plugin uses it as a hint but does not default to `$HOME/.nvm` -- it searches multiple locations. Keeping it explicit avoids ambiguity.

**Lines removed**: 31 (`source nvm.sh`) and 32 (`source bash_completion`).

### D2: Use gh plugin instead of eval for completions

**Choice**: Replace line 76 (`eval "$(gh completion -s zsh)"`) with the `gh` plugin.

**Rationale**: The plugin runs `gh completion --shell zsh >| "$ZSH_CACHE_DIR/completions/_gh" &|` which generates completions in a background process and caches them to disk. The current `eval` approach runs synchronously (~30ms). Both produce identical completions, but the plugin is non-blocking and cached.

**Alternative considered**: Keep the manual eval -- rejected because the plugin is strictly better (async + cached) with no downsides.

**Lines removed**: 76 and its comment on 75.

### D3: Use bun plugin instead of manual source

**Choice**: Replace line 135 (`source ~/.bun/_bun`) with the `bun` plugin.

**Rationale**: Same pattern as gh -- the plugin runs `bun completions` in background and caches the output. The current approach sources a static file that may become stale across bun updates.

**Lines retained**: 138-139 (`BUN_INSTALL` and `PATH`) are NOT covered by the plugin and must stay.

**Lines removed**: 135 and its comment on 134.

### D4: Plugin array ordering convention

**Choice**: Order plugins in the array by category with blank-line separators and inline comments.

**Rationale**: With 26 plugins, a flat unsorted list becomes hard to scan. Grouping by purpose (version control, tooling completions, productivity utilities, runtime managers) makes it clear why each plugin exists and simplifies future additions or removals.

```zsh
plugins=(
  # Version control
  git
  gitignore

  # Tool completions & aliases
  brew
  docker
  docker-compose
  npm
  macos
  gh

  # Productivity utilities
  aliases
  colored-man-pages
  command-not-found
  copybuffer
  copyfile
  copypath
  encode64
  extract
  fancy-ctrl-z
  history
  jsontools
  safe-paste
  sudo
  bgnotify
  urltools
  web-search
  you-should-use

  # Runtime managers
  nvm
  bun
)
```

**Alternative considered**: Alphabetical ordering -- rejected because it mixes unrelated plugins, making it harder to audit "do I have all my Docker plugins?" at a glance.

### D5: Do NOT add plugins that conflict with existing manual config

**Choice**: Explicitly exclude `eza`, `fzf`, `zoxide`, `starship`, and `z` plugins.

**Rationale**: These tools already have carefully tuned manual configurations in the aliases and init sections. The oh-my-zsh plugins for these tools would either override custom flags (eza), provide a simpler init than what exists (fzf), or duplicate functionality (z vs zoxide). The manual config is superior in each case.

## Risks / Trade-offs

**[nvm lazy first-use delay]** The first `node`/`npm`/`pnpm`/`yarn` command in each shell session takes ~300ms longer.
-> Mitigation: Acceptable trade-off. Most sessions involve only a few shell startups but many command executions. The startup savings compound across every new terminal tab/window.

**[bgnotify requires terminal-notifier on macOS]** Without `terminal-notifier`, bgnotify falls back to `growlnotify` or does nothing.
-> Mitigation: `terminal-notifier` can be added to the Brewfile. The plugin degrades gracefully -- it simply won't notify if no notification tool is found. Note: Ghostty is already detected by the plugin (`com.mitchellh.ghostty` is hardcoded in `bgnotify_programid`).

**[Plugin updates may change alias names]** oh-my-zsh plugin aliases are maintained upstream and could change between updates.
-> Mitigation: The `you-should-use` plugin helps discover aliases. The `aliases` plugin lists all active aliases. Both provide visibility into what's available. Custom aliases in the file always take precedence over plugin aliases.

**[safe-paste on modern zsh is a no-op]** On zsh >= 5.1, `safe-paste` only runs `autoload -Uz bracketed-paste-magic` which is already built-in behavior. It's essentially free but also provides no benefit on modern systems.
-> Mitigation: Keep it for backwards compatibility with any zsh < 5.1 environment. Zero cost on modern zsh.
