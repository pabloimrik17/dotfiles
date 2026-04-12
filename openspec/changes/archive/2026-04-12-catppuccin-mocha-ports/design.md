## Context

The dotfiles repo manages terminal tool configs via chezmoi. Catppuccin Mocha is the established theme (Ghostty, Bat, Starship, gh-enhance, OpenCode). Eight tools lack theming or use hand-rolled colors. Official Catppuccin ports exist for all eight.

Current file management patterns:

- **Chezmoi templates**: `dot_zshrc.tmpl`, `dot_gitconfig.tmpl` (configs with chezmoi variables)
- **Chezmoi plain files**: `dot_tmux.conf`, `dot_config/gh-dash/config.yml` (configs without variables)
- **Install-time downloads**: `run_onchange_install-packages.sh.tmpl` downloads bat theme from GitHub

## Goals / Non-Goals

**Goals:**

- Apply official Catppuccin Mocha to fzf, lazygit, tmux, delta, zsh-syntax-highlighting, gh-dash, atuin, eza
- Use blue (`#89b4fa`) as unified accent color across all ports with accent variants
- Automate theme installation on fresh machines via the existing install script
- Zero custom hex values — all colors from official upstream ports

**Non-Goals:**

- GUI apps (JetBrains, VS Code, Chrome, Firefox, Raycast)
- Changing OpenCode's Macchiato flavor (intentional choice)
- Modifying zsh-autosuggestions custom styling
- Adding tmux status modules beyond application + session (keep minimal, extend later)

## Decisions

### D1: Three file management patterns

**Inline edits** (fzf, gh-dash): Modify existing chezmoi-managed files. Theme values go directly in the config.

- Why: These tools configure colors within their main config, no external file needed.

**Committed new files** (lazygit, eza): Create `dot_config/<tool>/<file>` in the repo. Chezmoi deploys them.

- Why: These are small, self-contained YAML files. Committing them avoids download complexity and makes the theme content reviewable in the repo.
- Alternative considered: Downloading at install time like bat. Rejected because the files are small and stable — no benefit to fetching at runtime.

**Downloaded at install time** (delta, zsh-syntax-highlighting, atuin, tmux): Fetch from GitHub in the install script.

- Why: Delta's gitconfig contains all 4 flavors (not just Mocha) and is maintained upstream. The tmux plugin is a git clone. zsh-syntax-highlighting and atuin themes follow the same pattern as the existing bat download.
- Alternative considered: Committing these files. Rejected for delta (multi-flavor file, upstream changes) and tmux (full plugin repo). Acceptable for atuin/zsh-syntax-highlighting but keeping the pattern consistent.

### D2: tmux plugin — manual clone, pinned tag

Clone `catppuccin/tmux` to `~/.config/tmux/plugins/catppuccin/tmux/` at a pinned tag (v2.3.0), following the project's recommended approach. No TPM dependency.

- Why: TPM adds another plugin manager. Manual clone with pinned tag is simpler and reproducible. The catppuccin/tmux README explicitly recommends this approach.
- Trade-off: Must manually bump the tag for updates. Acceptable given infrequent theme changes.

### D3: delta — include gitconfig, activate via feature

Download `catppuccin.gitconfig` to `~/.config/delta/catppuccin.gitconfig`. Reference via `[include]` in `.gitconfig` and activate with `features = catppuccin-mocha`.

- Why: The official port provides a single gitconfig with all 4 flavors. The `[include]` + `features` pattern is the documented approach. The theme sets `syntax-theme = Catppuccin Mocha` internally, so the existing `BAT_THEME` env var becomes redundant for delta (but stays for bat itself and fzf previews).

### D4: zsh-syntax-highlighting — source before plugin

Download theme to `~/.zsh/catppuccin_mocha-zsh-syntax-highlighting.zsh`. Source it in `.zshrc` before oh-my-zsh loads the plugin.

- Why: The theme sets `ZSH_HIGHLIGHT_STYLES` associative array entries. These must be defined before zsh-syntax-highlighting reads them. The `[[ -f ... ]] && source` guard ensures graceful degradation if the file is missing.

### D5: fzf — include bg color

The official theme includes `bg:#1E1E2E`. This paints fzf's background explicitly rather than using the terminal's background.

- Decision: Keep it. Ghostty already sets `#1e1e2e` as background, so it matches. If someone uses a different terminal, fzf still renders correctly.

### D6: Install script section ordering

New download sections follow the existing bat theme section, grouped as "Catppuccin themes" block:

1. Bat theme (existing)
2. Delta theme (new)
3. zsh-syntax-highlighting theme (new)
4. Atuin theme (new)
5. tmux plugin (new)

Each section uses the same pattern: check if file/dir exists, skip if present, download/clone if missing, with `info` messages.

## Risks / Trade-offs

**[tmux plugin size]** The full catppuccin/tmux repo is cloned for a single theme. → Mitigation: Shallow clone (`--depth 1`) at pinned tag reduces size to ~100KB.

**[zsh load order sensitivity]** The zsh-syntax-highlighting theme must load before the plugin. → Mitigation: Place the source line early in `.zshrc`, well before the `source $ZSH/oh-my-zsh.sh` line. Add comment explaining the ordering constraint.

**[delta gitconfig conflicts]** The `features` directive in delta could conflict if user adds other features later. → Mitigation: Delta supports comma-separated features (`features = catppuccin-mocha my-other-feature`). Document this in a comment.

**[Network dependency at install]** Four tools require downloads. → Mitigation: All downloads are guarded with existence checks (idempotent). Failure to download degrades gracefully — tools work without theming, just with default colors.
