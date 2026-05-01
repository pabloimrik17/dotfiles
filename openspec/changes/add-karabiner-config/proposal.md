## Why

We have no keyboard remapping. Two high-impact ergonomic changes: Caps Lock → Control (the most-used key in an accessible spot instead of the corner) and Ctrl+HJKL → arrow keys (vim-style navigation across all macOS apps without leaving the home row). Inspired by the Karabiner config from omerxx/dotfiles.

## What Changes

- Install Karabiner-Elements via brew cask
- Create a JSON configuration with the remaps:
  - Caps Lock → Left Control (system-wide)
  - Right Cmd + HJKL → Arrow keys (vim navigation)
  - Left Ctrl + HJKL → Arrow keys (vim navigation, complementary to Caps→Ctrl)
- Add the Karabiner config to the dotfiles managed by Chezmoi
- Add Karabiner-Elements to the install script

## Capabilities

### New Capabilities
- `karabiner-config`: Karabiner-Elements configuration with keyboard remaps (Caps→Ctrl, vim arrows)

### Modified Capabilities

## Impact

- **New files:** `dot_config/karabiner/karabiner.json` (or the equivalent Chezmoi structure)
- **Modified files:** `run_onchange_install-packages.sh.tmpl` (add brew cask)
- **New dependencies:** `karabiner-elements` (brew cask)
- **Risk:** Low. Karabiner only acts while it is running. If disabled, the keyboard returns to its default behavior. It does not affect any other dotfile.
