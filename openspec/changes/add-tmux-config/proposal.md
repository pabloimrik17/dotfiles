## Why

The current tmux setup is minimal (260 bytes: mouse, colors, focus events). It has no plugins, no session persistence, and no advanced management. Inspired by the omerxx/dotfiles setup, we expand tmux with a plugin ecosystem that adds persistence, named sessions, floating panes, and smart text selection. This lets us evaluate tmux as an alternative/complement to Ghostty's native tabs and splits.

## What Changes

- Expand `dot_tmux.conf` with a full configuration: prefix Ctrl+A, vi mode, top status bar, 1M-line history
- Add TPM (Tmux Plugin Manager) as the plugin manager
- Install plugins: resurrect + continuum (automatic session persistence), sessionx (session management with fzf/zoxide), floax (floating panes), thumbs (fast text selection), fzf-url (open URLs from tmux)
- Apply the Catppuccin Mocha theme for visual consistency with Ghostty and Starship
- Add TPM and plugins to the interactive install script (`run_onchange_install-packages.sh.tmpl`)

## Capabilities

### New Capabilities
- `tmux-plugins`: Plugin management via TPM, including resurrect, continuum, sessionx, floax, thumbs, fzf-url, and the catppuccin theme
- `tmux-keybindings`: Prefix Ctrl+A, vi copy mode, pane navigation, shortcuts for splits and sessions

### Modified Capabilities
- `tmux-config`: Extend the base configuration with a status bar, expanded history, and advanced behavior options

## Impact

- **Modified files:** `dot_tmux.conf`, `run_onchange_install-packages.sh.tmpl`
- **New dependencies:** TPM (git clone), tmux plugins (managed by TPM)
- **Brew packages:** None additional (tmux is already in the install script)
- **Risk:** Low. The existing tmux config is extended, not broken. Plugins are optional (TPM installs them on demand).
