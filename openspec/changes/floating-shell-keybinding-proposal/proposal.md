## Why

`super+shift+t` (Cmd+Shift+T) collides with Chrome's "reopen last closed tab" — a heavily used shortcut. The quick terminal keybind needs to change to `ctrl+º` (Ctrl+º on Spanish keyboard), a Quake-style binding that's free in macOS, Chrome, and WebStorm.

## What Changes

- **BREAKING**: Quick terminal global keybind changes from `super+shift+t` to `ctrl+º`
- Ghostty config line updated: `keybind = global:ctrl+º=toggle_quick_terminal`

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ghostty-quick-terminal`: Global keybind requirement changes from `super+shift+t` to `ctrl+º`

## Impact

- `dot_config/ghostty/config`: keybind line changes
- `openspec/specs/ghostty-quick-terminal/spec.md`: keybind requirement + scenarios updated
- Users must re-learn the shortcut (muscle memory)
