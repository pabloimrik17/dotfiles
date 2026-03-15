## Why

Ghostty supports native splits but the config has no keybindings for them. Users must rely on default bindings or the mouse. Adding explicit split keybindings enables a tmux-lite workflow — create, navigate, resize, and manage splits entirely from the keyboard using conventions familiar from iTerm2/VS Code.

## What Changes

- Add keybindings for creating vertical (`super+d`) and horizontal (`super+shift+d`) splits
- Add keybindings for navigating between splits (`super+alt+arrow`)
- Add keybindings for resizing splits (`super+ctrl+arrow`) using `resize_split` with 40px increments per keypress
- Add keybindings for split zoom toggle (`super+shift+enter`) and equalize (`super+shift+equal`)
- Group all split keybindings under a dedicated comment section in the config

## Capabilities

### New Capabilities

- `ghostty-split-keybindings`: Keybindings for creating, navigating, resizing, and managing Ghostty native splits

### Modified Capabilities

_(none)_

## Impact

- **File**: `dot_config/ghostty/config` — new keybind lines added to the keybindings section
- **No breaking changes** — all new bindings use currently unbound key combinations
- **No dependency changes**
