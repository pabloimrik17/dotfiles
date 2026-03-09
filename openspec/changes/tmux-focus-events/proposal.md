## Why

The repo's `dot_tmux.conf` has `mouse on` and `default-terminal` but is missing `focus-events on` which is already set on the actual machine. Without it, tmux swallows focus events -- breaking vim's `autoread` (files don't auto-reload on focus) and Ghostty's shell integration features.

Closes #29.

## What Changes

- **Add `set -g focus-events on`** to `dot_tmux.conf` with a descriptive comment, matching the existing comment style
- **Group related settings** logically (terminal behavior together, interaction together) now that there are 3 settings

## Capabilities

### Modified Capabilities

- `tmux-config`: Adds focus event passthrough. No new files, no new dependencies, no behavioral risk -- this is a standard tmux best-practice setting.

## Impact

- **Files modified**: `dot_tmux.conf` (1 line + 1 comment added)
- **Risk**: None. `focus-events on` is a passive setting -- it only enables event forwarding that applications can optionally consume. No change to existing mouse or terminal behavior.
- **Dependencies**: None. Requires tmux >= 1.9 (current minimum is effectively guaranteed on any modern macOS).
