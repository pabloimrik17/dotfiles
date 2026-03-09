## Why

Ghostty defaults `clipboard-read` to `deny`, blocking OSC 52 clipboard reads used by tmux (clipboard sync), neovim over SSH, and shell scripts. `allow` works but lets any terminal program silently read clipboard contents — a security risk for passwords/tokens. `ask` shows a confirmation dialog only when something requests clipboard read, which is rare in practice.

Closes #39.

## What Changes

- **Add `clipboard-read = ask`** to the Copy/paste section in `dot_config/ghostty/config`
- **Add inline comment** explaining why `ask` (security tradeoff) and what needs it (tmux, neovim SSH, scripts)

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `ghostty-ux-enhancements`: Adding `clipboard-read = ask` requirement to the clipboard handling section

## Impact

- **Files modified**: `dot_config/ghostty/config` (1 setting + comment added to Copy/paste section)
- **Dependencies**: none
- **Risk**: minimal — `ask` means a dialog on OSC 52 read requests. Rare in practice.
