## Context

The dotfiles use chezmoi for cross-platform configuration management. The current fuzzy-finding stack is:

- **fzf** — shell integration (Ctrl+T files, Ctrl+R history, Alt+C dirs) + generic pipe tool
- **atuin** — already replaced fzf's Ctrl+R for shell history (AI search, sync, stats)
- **fd** — fast file finder, used as fzf's backend
- **bat** — syntax-highlighted previews in fzf functions
- **Four shell functions** (`fgco`, `fglog`, `fkill`, `frg`) that manually glue fzf with git/ps/rg

Television (`tv`) is a Rust fuzzy finder where channels are declarative TOML configs with source, preview, keybindings, and post-selection actions. The built-in cable channels already implement equivalent (and richer) versions of the four shell functions.

Key constraint: the theme stack is **catppuccin-mocha** across Ghostty and Starship. Television's built-in `catppuccin` theme is not mocha-specific — the [catppuccin/television](https://github.com/catppuccin/television) repo provides per-flavor theme files.

## Goals / Non-Goals

**Goals:**

- Add television as a brew package with chezmoi-managed configuration
- Replace four hand-rolled shell functions with built-in tv channels (net reduction of ~19 lines of shell)
- Enable context-aware smart autocomplete via Ctrl+T (the primary UX improvement)
- Maintain visual consistency with catppuccin-mocha-mauve theme
- Keep fzf fully functional for Alt+C, pipe usage, and install-script cask picker

**Non-Goals:**

- Removing fzf from the stack (it remains for Alt+C directory jump, `| fzf` piping, and install-script cask picker)
- Migrating atuin's Ctrl+R to television (atuin is superior for history with AI search and sync)
- Creating custom cable channels beyond `rg-edit` (the 50+ community channels cover everything else)
- Managing tv's cable directory via chezmoi (cable channels are auto-downloaded by `tv update-channels` and are not user config)

## Decisions

### Decision 1: Ctrl+T ownership goes to television, fzf keeps Alt+C

**Choice**: tv owns Ctrl+T (smart autocomplete), fzf keeps Alt+C (directory jump), atuin keeps Ctrl+R (history).

**Alternatives considered**:

- _tv owns all keybindings_: tv has no Alt+C equivalent and its Ctrl+R history is inferior to atuin's
- _Keep fzf's Ctrl+T_: Loses the context-aware smart autocomplete feature, which is the primary reason for adopting tv

**Rationale**: The init order in zshrc ensures correct keybinding ownership:

1. `source <(fzf --zsh)` — binds Ctrl+T, Alt+C
2. `eval "$(tv init zsh)"` — overwrites Ctrl+T with smart autocomplete, binds Ctrl+R
3. `eval "$(atuin init zsh --disable-up-arrow)"` — overwrites Ctrl+R with atuin

Note: tv's config parser does not support disabling `command_history` via empty string or "none" — the field requires a valid keybinding. The init ordering alone is sufficient since atuin's init runs after tv's and overwrites Ctrl+R.

### Decision 2: Theme file downloaded from catppuccin/television repo, not the built-in

**Choice**: Download `catppuccin-mocha-mauve.toml` from [catppuccin/television](https://github.com/catppuccin/television) and manage it via chezmoi at `dot_config/television/themes/catppuccin-mocha-mauve.toml`.

**Alternatives considered**:

- _Use built-in `catppuccin` theme_: Generic, not guaranteed to be mocha variant
- _Use `theme_overrides` to patch the built-in_: Fragile, requires manually tracking all mocha hex values

**Rationale**: The catppuccin project maintains official themes per-flavor-per-accent. Using the mauve accent matches the catppuccin brand identity color and the autosuggestions highlight (`#cba6f7` Mauve) already in the zshrc.

### Decision 3: One custom channel (`rg-edit`), everything else is community channels

**Choice**: Only create one custom cable channel for the ripgrep-to-editor workflow. All other use cases (git-branch, git-log, procs, docker, tmux, etc.) use community channels downloaded by `tv update-channels`.

**Alternatives considered**:

- _Custom channels for all workflows_: Unnecessary maintenance burden when community channels are better maintained and richer
- _No custom channels at all_: The `tv text` built-in channel doesn't support opening the editor at the matched line

**Rationale**: The community `git-branch` channel already includes checkout, delete, merge, and rebase actions. The `procs` channel already includes kill, term, stop, and cont. There's no reason to duplicate these. The only gap is `rg-edit` — searching file contents and opening the editor at the exact line number.

### Decision 4: tv init before atuin init, fzf init before tv init

**Choice**: Shell initialization order is `fzf → tv → atuin`.

**Rationale**: Each tool binds keybindings during init. The last one to bind a key wins. This order ensures:

- fzf binds Ctrl+T, Alt+C, Ctrl+R
- tv overwrites Ctrl+T (smart autocomplete) and Ctrl+R (shell history)
- atuin overwrites Ctrl+R (AI-powered history)

Final result: Ctrl+T=tv, Alt+C=fzf, Ctrl+R=atuin.

### Decision 5: `tv update-channels` runs as a post-install step, not chezmoi-managed

**Choice**: Run `tv update-channels` in the install script after `television` is installed. Do NOT manage `~/.config/television/cable/` via chezmoi.

**Alternatives considered**:

- _Manage cable dir via chezmoi_: The cable directory contains 50+ TOML files auto-generated by `tv update-channels`, managing them in chezmoi would be excessive and would fall out of sync with upstream

**Rationale**: Cable channels are community-maintained and update frequently. Running `tv update-channels` once during setup downloads the latest versions. Users can re-run it anytime. The only chezmoi-managed file in the cable directory is the custom `rg-edit.toml`.

### Decision 6: Shell functions fully removed, not aliased

**Choice**: Delete `fgco()`, `fglog()`, `fkill()`, `frg()` entirely. Do not alias them to tv equivalents.

**Alternatives considered**:

- _Alias `fglog="tv git-log"` etc._: Creates a parallel naming convention that hides the native tv interface
- _Keep functions as tv wrappers_: No benefit over using `tv <channel>` directly

**Rationale**: The `tv <channel>` syntax is self-documenting and discoverable via tab completion. Aliases would teach muscle memory for names that don't exist outside this dotfiles setup. Users should learn the native `tv` interface.

## Risks / Trade-offs

**[Ctrl+T behavior change]** Users accustomed to fzf's Ctrl+T always showing files will now get context-aware results. → Mitigation: The fallback channel is still `files` when no trigger matches, so typing Ctrl+T on an empty prompt behaves the same as before.

**[cable channel breakage on tv updates]** A tv version update could change community channel TOML format. → Mitigation: `tv update-channels` can be re-run anytime. The custom `rg-edit.toml` is simple and follows the documented format.

**[catppuccin theme file drift]** The theme file is a static copy from catppuccin/television. If upstream changes format, it could break. → Mitigation: Theme files are simple color definitions unlikely to change format. Can be re-downloaded if needed.

**[fzf Ctrl+T still briefly bound]** During shell init, fzf's Ctrl+T is active for a fraction of a second before tv overwrites it. → Mitigation: This is imperceptible and has no user impact.
