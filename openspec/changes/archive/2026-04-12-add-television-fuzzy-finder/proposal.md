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
- Ctrl+R ownership handled by init ordering only — tv's config parser does not support disabling `command_history` (see Implementation Notes)
- fzf shell integration stays untouched (`source <(fzf --zsh)` remains) — fzf is still used for Alt+C directory jump and as a generic pipe tool (`| fzf`)

### Configuration (new chezmoi-managed files)

- `~/.config/television/config.toml` — theme, shell integration triggers, UI tweaks
- `~/.config/television/themes/catppuccin-mocha-mauve.toml` — downloaded from [catppuccin/television](https://github.com/catppuccin/television) for visual consistency with Ghostty and Starship
- `~/.config/television/cable/rg-edit.toml` — one custom channel (see below)

### Config highlights

- **Theme**: catppuccin-mocha-mauve (matches Ghostty `theme = catppuccin-mocha` and Starship `palette = 'catppuccin_mocha'`)
- **Ctrl+R owned by atuin** via init ordering (atuin handles history with AI search, sync, and stats — superior)
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
- `television-shell-integration`: tv init in zshrc with Ctrl+T smart autocomplete, Ctrl+R owned by atuin via init ordering
- `television-rg-edit-channel`: Custom cable channel for ripgrep → editor workflow

### Modified Capabilities

- `zsh-config`: tv init added to shell initialization, fzf power functions and git+fzf functions removed
- `cli-tool-expansion`: television added to BREW_PACKAGES, tv update-channels added as post-install step

## Impact

- **Files modified**: `dot_zshrc.tmpl`, `run_onchange_install-packages.sh.tmpl`
- **Files created**: `dot_config/television/config.toml`, `dot_config/television/themes/catppuccin-mocha-mauve.toml`, `dot_config/television/cable/rg-edit.toml`
- **Dependencies**: `brew` (existing), `rg` (existing), `bat` (existing), `fd` (existing)
- **Low-impact behavior changes**: fzf stays installed and functional — Alt+C and `| fzf` piping still work. Ctrl+T now launches tv smart autocomplete instead of fzf file search (empty prompt falls back to fzf files). The `fgco`, `fglog`, `fkill`, and `frg` shell functions are removed; their workflows are replaced by `tv git-branch`, `tv git-log`, `tv procs`, and `tv rg-edit` respectively.
- **Net lines of shell code removed**: ~19 lines of function definitions replaced by declarative TOML configs

## Implementation Notes

Discoveries and deviations from the original plan, captured during implementation:

### rg-edit channel uses `$EDITOR -g` for line navigation

The action command uses `$EDITOR -g '{file}:{line}'` which relies on VS Code's `--goto` flag syntax. Since the dotfiles set `EDITOR="code --wait"` globally, this works correctly. If the editor changes to one that doesn't support `-g` (e.g., vim uses `+N` syntax), the channel TOML needs a manual update. tv cable channel commands are executed through the shell, so `$EDITOR` expands correctly.

### Ctrl+R disabled in tv via `no_op` keybinding and init ordering

The original plan was to set `command_history = ""` in config.toml, but tv's config parser does not support empty strings for keybinding fields. The implementation uses two complementary mechanisms: `ctrl-r = "no_op"` in `[keybindings]` disables Ctrl+R inside tv's TUI, and init ordering (atuin inits after tv) ensures atuin owns Ctrl+R in the shell.

### Ctrl+T on empty prompt falls back to fzf file search

tv's smart autocomplete delegates to zsh's `expand-or-complete` when no command is typed, which dumps 4000+ completions. Fixed by setting `fzf_default_completion=fzf-file-widget` after tv init, so the empty-prompt case launches fzf's familiar fuzzy file search instead.

### tv init is guarded by `command -v tv`

Added per CodeRabbit review feedback. Prevents `command not found: tv` errors on first bootstrap before television is installed. Same pattern used for `direnv` and `worktrunk` in the zshrc.
