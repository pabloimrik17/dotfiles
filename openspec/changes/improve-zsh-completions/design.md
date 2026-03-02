## Context

The dotfiles ZSH setup uses Oh-My-Zsh as plugin manager with Homebrew-installed external plugins (`zsh-autosuggestions`, `zsh-syntax-highlighting`). The shell config is managed via chezmoi with OS/arch-conditional templating (`darwin`/`arm64` vs `x86_64` vs Linux). Tab-completion currently relies solely on Oh-My-Zsh's built-in `compinit` plus individual tool completions (`gh`, `bun`, `nvm`, `fzf`). Many installed CLI tools (`fd`, `rg`, `brew`, `eza`, etc.) lack dedicated completion definitions.

## Goals / Non-Goals

**Goals:**

- Add ~300+ additional completion definitions via `zsh-completions` for tools not covered by OMZ
- Install `zsh-completions` through the same Homebrew-based mechanism used for other zsh plugins
- Integrate into `.zshrc` using the established chezmoi OS/arch templating pattern
- Ensure completions are available to `compinit` by loading FPATH before `source $ZSH/oh-my-zsh.sh`

**Non-Goals:**

- Replacing Oh-My-Zsh's completion system or switching to a different plugin manager
- Adding custom `zstyle` completion configuration (that's a separate concern)
- Adding completion caching beyond what OMZ already provides
- Supporting package managers other than Homebrew for macOS

## Decisions

### 1. FPATH insertion before OMZ source (not as OMZ plugin)

`zsh-completions` is a collection of completion definition files, not a sourceable plugin script. It must be added to `FPATH` so that `compinit` (run inside `source $ZSH/oh-my-zsh.sh`) discovers the extra definitions.

**Alternative considered**: Cloning into `$ZSH/custom/plugins/` and adding to the `plugins=()` array. Rejected because `zsh-completions` doesn't follow the OMZ plugin convention (no `*.plugin.zsh` file). The FPATH approach is what Homebrew and the zsh-completions README recommend.

**Placement in `dot_zshrc.tmpl`**: Insert the FPATH line between the `plugins=()` array and `source $ZSH/oh-my-zsh.sh` (between current lines 22 and 24). This is the only location that guarantees `compinit` sees the new paths.

### 2. Same chezmoi templating pattern as existing plugins

Use the identical `{{ if eq .chezmoi.os "darwin" }}` / `{{ if eq .chezmoi.arch "arm64" }}` conditional structure already established for `zsh-autosuggestions` and `zsh-syntax-highlighting`. This keeps the config consistent and portable.

Paths:
- macOS arm64: `/opt/homebrew/share/zsh-completions`
- macOS x86_64: `/usr/local/share/zsh-completions`
- Linux: `/usr/share/zsh-completions`

### 3. Install alongside existing zsh plugin brew loop

Add `zsh-completions` to the existing `for pkg in zsh-autosuggestions zsh-syntax-highlighting` loop in the install script (Group 3). No new install group needed. The `brew list` idempotency check already handles re-runs.

## Risks / Trade-offs

- **[Stale zcompdump cache]** OMZ caches compiled completions in `~/.zcompdump`. After first install, new completions may not appear until the cache is rebuilt. **Mitigation**: OMZ runs `compinit` on every shell start; the cache auto-regenerates. If needed, `rm -f ~/.zcompdump*` forces a rebuild.
- **[FPATH order sensitivity]** If `zsh-completions` defines a completion that conflicts with an OMZ built-in, the one earlier in FPATH wins. **Mitigation**: Append (not prepend) `zsh-completions` to FPATH so OMZ built-ins take priority. Use `FPATH=$FPATH:/path/to/zsh-completions` instead of `FPATH=/path/to/zsh-completions:$FPATH`.
