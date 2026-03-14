## Why

`shell-integration = zsh` hardcodes the shell type, so integration features (cursor positioning, sudo forwarding, window titles, command-finish notifications) only work in zsh sessions. Running bash inside Ghostty (scripts, Docker, SSH into Linux) gets no integration. `detect` auto-detects the active shell and is a strict superset — identical behavior for zsh, plus coverage for other shells.

## What Changes

- Change `shell-integration = zsh` to `shell-integration = detect` in `dot_config/ghostty/config`
- Update the `ghostty-ux-enhancements` spec to reflect the new value and remove the zsh-specific reference

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `ghostty-ux-enhancements`: The `cursor-click-to-move` requirement references `shell-integration = zsh` as a prerequisite — update to reference `shell-integration = detect`

## Impact

- `dot_config/ghostty/config` — single line change
- `openspec/specs/ghostty-ux-enhancements/spec.md` — update contextual reference
