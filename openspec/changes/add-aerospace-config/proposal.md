## Why

We use Rectangle for window management with fixed layouts and apps that always go to the same place, in a 3-screen setup (laptop + 2 monitors) with 7 desktops. AeroSpace automates what is currently done manually: automatic tiling, app-to-workspace assignment, workspaces per monitor, and instant alt+hjkl navigation without macOS animations. Inspired by the omerxx/dotfiles config.

## What Changes

- Install AeroSpace via brew cask
- Create a TOML configuration with:
  - Window navigation: alt+HJKL
  - Move windows: alt+shift+HJKL
  - Workspaces 1-7 with alt+number (instant switch)
  - App-to-workspace auto-assignment rules
  - Workspace-to-monitor assignments for 3 screens
  - Floating apps list (Finder, calculator, etc.)
  - Configurable gaps
- Add the config to the dotfiles managed by Chezmoi
- Add AeroSpace to the install script
- Document that it replaces Rectangle

## Capabilities

### New Capabilities
- `aerospace-config`: AeroSpace tiling WM configuration (workspaces, navigation, per-app rules, multi-monitor)

### Modified Capabilities

## Impact

- **New files:** `dot_config/aerospace/aerospace.toml`
- **Modified files:** `run_onchange_install-packages.sh.tmpl` (add brew cask, optionally remove Rectangle)
- **New dependencies:** `aerospace` (brew cask)
- **Replaces:** Rectangle (can be uninstalled once AeroSpace is validated)
- **Risk:** Medium. Switching window managers requires an adaptation period (~1-2 weeks). Rectangle can stay installed while AeroSpace is being evaluated.
