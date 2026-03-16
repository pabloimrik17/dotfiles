## Why

Ghostty supports native splits but the config has no keybindings for them. Users must rely on default bindings or the mouse. Adding explicit split keybindings enables a tmux-lite workflow — create, navigate, resize, and manage splits entirely from the keyboard using conventions familiar from iTerm2/VS Code.

## What Changes

- Add keybindings for creating vertical (`super+d`) and horizontal (`super+shift+d`) splits
- Add keybindings for navigating between splits: `super+alt+left/right/up/down` mapping to `goto_split:left/right/top/bottom`
- Add keybindings for resizing splits: `super+ctrl+left/right/up/down` mapping to `resize_split:left/right/up/down,40` (40px increments per keypress)
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

### Example config lines

```
# Splits
keybind = super+d=new_split:right
keybind = super+shift+d=new_split:down
keybind = super+alt+left=goto_split:left
keybind = super+alt+right=goto_split:right
keybind = super+alt+up=goto_split:top
keybind = super+alt+down=goto_split:bottom
keybind = super+ctrl+left=resize_split:left,40
keybind = super+ctrl+right=resize_split:right,40
keybind = super+ctrl+up=resize_split:up,40
keybind = super+ctrl+down=resize_split:down,40
keybind = super+shift+enter=toggle_split_zoom
keybind = super+shift+equal=equalize_splits
```
