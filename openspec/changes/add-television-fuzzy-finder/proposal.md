## Why

The dotfiles already have a solid fuzzy-finding setup with fzf (file search, directory jump, piped pickers) and custom shell functions (`fglog`, `fgco`, `fkill`, `frg`) that glue fzf with git, ripgrep, and bat. This works, but each function is hand-rolled shell code that re-implements the same pattern: generate lines → pipe to fzf → parse selection → do something.

[Television](https://github.com/alexpasmantier/television) (`tv`) is a Rust-based fuzzy finder that replaces this pattern with declarative TOML channels — each channel defines its source, preview, keybindings, and post-selection actions. The built-in and community channels already cover git-branch (with checkout/delete/merge/rebase actions), git-log, procs (with kill/term/stop/cont signals), docker containers, tmux sessions, and 50+ more data sources. What used to require 5-10 lines of shell per function is now zero lines — the channel handles it.

The killer feature is **smart autocomplete** (Ctrl+T): instead of always showing files like fzf does, tv inspects the current prompt and picks the right channel. Type `git checkout ` then Ctrl+T → git branches. Type `ssh ` then Ctrl+T → SSH hosts. Type `docker run ` then Ctrl+T → docker images. This is configurable via channel triggers in a TOML config.

## What Changes

### Installation

- Add `television` to `BREW_PACKAGES` in the install script
- Add a post-install step to run `tv update-channels` (downloads 50+ community cable channels)

### Shell integration

- Add `eval "$(tv init zsh)"` to zshrc, **before** the atuin init (so atuin's Ctrl+R wins over tv's)
- Disable tv's Ctrl+R binding explicitly via config (belt and suspenders — atuin owns history search)
- fzf shell integration stays untouched (`source <(fzf --zsh)` remains) — fzf is still used for Alt+C directory jump and as a generic pipe tool (`| fzf`)

### Configuration (new chezmoi-managed files)

- `~/.config/television/config.toml` — theme, shell integration triggers, UI tweaks
- `~/.config/television/themes/catppuccin-mocha-mauve.toml` — downloaded from [catppuccin/television](https://github.com/catppuccin/television) for visual consistency with Ghostty and Starship
- `~/.config/television/cable/rg-edit.toml` — one custom channel (see below)

### Config highlights

- **Theme**: catppuccin-mocha-mauve (matches Ghostty `theme = catppuccin-mocha` and Starship `palette = 'catppuccin_mocha'`)
- **Ctrl+R disabled** in tv (atuin handles history with AI search, sync, and stats — superior)
- **Ctrl+T** = tv smart autocomplete (context-aware, replaces fzf's always-files behavior)
- **Channel triggers** map common commands to the right channel:
    - `git checkout/switch/merge/rebase` → git-branch
    - `git show/revert/cherry-pick` → git-log
    - `git add/restore` → git-diff
    - `docker run/rmi` → docker-images
    - `docker stop/start/rm/logs/exec` → docker-containers
    - `ssh/scp` → ssh-hosts
    - `tmux attach/switch` → tmux-sessions
    - `cd/ls/rmdir` → dirs
    - `bun run` → npm-scripts
    - `z` → zoxide
- **Help panel visible by default** — shows keybindings until the user learns them
- **Preview panel 55%** — slightly more generous than the default 50%

### Shell functions removed

All four `fXXX` functions are replaced by built-in tv channels that do more:

| Function  | Lines | Replaced by                   | What you gain                                              |
| --------- | ----- | ----------------------------- | ---------------------------------------------------------- |
| `fgco()`  | 7     | `tv git-branch`               | Enter=checkout, Ctrl+D=delete, Ctrl+M=merge, Ctrl+R=rebase |
| `fglog()` | 3     | `tv git-log`                  | Built-in preview, frecency sorting                         |
| `fkill()` | 4     | `tv procs`                    | Ctrl+K=SIGKILL, F2=SIGTERM, Ctrl+S=SIGSTOP, Ctrl+C=SIGCONT |
| `frg()`   | 5     | `tv rg-edit` (custom channel) | Same workflow, declarative config instead of shell code    |

### Custom channel: `rg-edit`

The only custom cable channel needed. Replicates `frg()` behavior: ripgrep search → bat preview with line highlight → open file in editor at exact line. This can't be done with the built-in `text` channel because `tv text` doesn't open the editor at the matched line.

### Comments removed from zshrc

- The `# fzf power functions` section header
- The `# Git + fzf integration` section header

## Capabilities

### New Capabilities

- `television-install`: Television binary installed via brew, cable channels updated on setup
- `television-config`: Chezmoi-managed config.toml with catppuccin-mocha-mauve theme, smart autocomplete triggers, and UI preferences
- `television-shell-integration`: tv init in zshrc with Ctrl+T smart autocomplete, Ctrl+R disabled (atuin owns it)
- `television-rg-edit-channel`: Custom cable channel for ripgrep → editor workflow

### Modified Capabilities

- `zsh-config`: tv init added to shell initialization, fzf power functions and git+fzf functions removed
- `cli-tool-expansion`: television added to BREW_PACKAGES, tv update-channels added as post-install step

## Impact

- **Files modified**: `dot_zshrc.tmpl`, `run_onchange_install-packages.sh.tmpl`
- **Files created**: `dot_config/television/config.toml`, `dot_config/television/themes/catppuccin-mocha-mauve.toml`, `dot_config/television/cable/rg-edit.toml`
- **Dependencies**: `brew` (existing), `rg` (existing), `bat` (existing), `fd` (existing)
- **No breaking changes**: fzf stays installed and functional. Alt+C still works. `| fzf` piping still works. The only behavioral change is Ctrl+T now launches tv's smart autocomplete instead of fzf's file search.
- **Net lines of shell code removed**: ~19 lines of function definitions replaced by declarative TOML configs
