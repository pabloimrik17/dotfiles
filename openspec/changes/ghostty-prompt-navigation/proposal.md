## Why

Claude Code and other AI tools produce verbose terminal output, forcing users to scroll hundreds of lines to find previous commands. Ghostty's shell integration already marks prompt locations via OSC 133 — adding `jump_to_prompt` keybindings lets users navigate between prompts instantly.

## What Changes

- Add `keybind = super+shift+up=jump_to_prompt:-1` to jump to the previous prompt
- Add `keybind = super+shift+down=jump_to_prompt:1` to jump to the next prompt
- Both keybindings are placed in the existing Keybindings section of `dot_config/ghostty/config`

## Capabilities

### New Capabilities

- `ghostty-prompt-navigation`: Keybindings for jumping between shell prompts in the Ghostty terminal scrollback

### Modified Capabilities

_None — no existing spec requirements change._

## Impact

- **File**: `dot_config/ghostty/config` — two new `keybind` lines added to the Keybindings section
- **Dependencies**: Relies on `shell-integration = zsh` (already configured) which emits OSC 133 prompt markers
- **No breaking changes**: `super+shift+up/down` are currently unbound
