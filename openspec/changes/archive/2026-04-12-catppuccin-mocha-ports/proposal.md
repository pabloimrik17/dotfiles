## Why

The dotfiles use Catppuccin Mocha as the global theme, but only 5 of 13 TUI tools have it applied. Tools like tmux, lazygit, fzf, and delta render with default or inherited colors. gh-dash has a hand-rolled implementation that diverges from the official port (e.g., red for warning instead of yellow, no error field). Official Catppuccin ports exist for all 8 remaining tools — using them gives consistent palette, upstream maintenance, and a unified blue accent.

## What Changes

- **fzf**: Add official `--color` block to `FZF_DEFAULT_OPTS` in zshrc
- **lazygit**: Create config with official Mocha blue theme
- **tmux**: Add Catppuccin plugin with themed status line (application + session modules)
- **delta**: Include official `catppuccin.gitconfig` with diff blend colors, blame palette, and map-styles
- **zsh-syntax-highlighting**: Source official Catppuccin Mocha theme file before plugin
- **gh-dash**: Replace custom colors with official port (blue accent, semantic warning/error split)
- **atuin**: Add official Mocha blue theme via downloaded `.toml`
- **eza**: Add official Mocha blue theme for file/directory coloring
- **Install script**: New download sections for delta gitconfig, zsh-syntax-highlighting .zsh, atuin theme, and tmux plugin clone (following existing bat theme pattern)

## Capabilities

### New Capabilities

- `fzf-catppuccin`: Official Catppuccin Mocha color scheme for fzf UI elements (header, pointer, marker, spinner, border, highlights)
- `lazygit-catppuccin`: Official Catppuccin Mocha theme for lazygit (borders, selection, diff, cherry-pick, author colors)
- `tmux-catppuccin`: Catppuccin tmux plugin with Mocha flavor and rounded window status style
- `delta-catppuccin`: Official Catppuccin delta theme with diff blend colors, blame palette, and moved-code map-styles
- `zsh-syntax-catppuccin`: Official Catppuccin Mocha theme for zsh-syntax-highlighting (commands, strings, options, paths)
- `eza-catppuccin`: Official Catppuccin Mocha theme for eza file listings (file kinds, permissions, sizes, git status)
- `atuin-catppuccin`: Official Catppuccin Mocha theme for atuin history UI

### Modified Capabilities

- `gh-dash-config`: Replace custom color values with official Catppuccin port (blue accent, adds error field, fixes semantic warning color)

## Impact

- **Files modified**: `dot_zshrc.tmpl`, `dot_gitconfig.tmpl`, `dot_tmux.conf`, `dot_config/gh-dash/config.yml`, `dot_config/atuin/config.toml`, `run_onchange_install-packages.sh.tmpl`
- **Files created**: `dot_config/lazygit/config.yml`, `dot_config/eza/theme.yml`
- **External dependencies**: Downloads from catppuccin GitHub repos (delta, zsh-syntax-highlighting, atuin, tmux plugin clone)
- **Accent color**: Blue (`#89b4fa`) unified across all ports that offer accent variants
