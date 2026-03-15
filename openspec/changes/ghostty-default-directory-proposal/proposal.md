## Why

The current Ghostty config sets all three `*-inherit-working-directory` options to `true`, meaning every new window, tab, and split inherits the working directory of the previously focused surface. In practice, ~60% of new tabs are for a fresh context (unrelated to the current directory), while splits are the natural tool for "more space in the same project." Defaulting tabs and windows to `$HOME` reduces unnecessary `cd` friction for the majority use case, while keeping split inheritance for contextual work. Zoxide (`z`) covers the minority case where a new tab needs to land in a recent directory.

## What Changes

- Set `working-directory = home` explicitly to ensure consistent behavior regardless of how Ghostty is launched (Dock, Spotlight, or terminal)
- Set `window-inherit-working-directory = false` — new windows start at `$HOME`
- Set `tab-inherit-working-directory = false` — new tabs start at `$HOME`
- Keep `split-inherit-working-directory = true` — splits inherit the current surface's working directory

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `ghostty-ux-enhancements`: The working directory inheritance requirement changes from "all three inherit = true" to a differentiated policy — splits inherit, windows and tabs fall back to `$HOME`

## Impact

- **Config file**: `dot_config/ghostty/config` — one new line (`working-directory`), two lines changed (`window-inherit`, `tab-inherit` → `false`)
- **User workflow**: Tabs and windows open at home; splits stay contextual. Users rely on zoxide for quick navigation in the 40% of cases where a new tab needs a prior directory.
- **No breaking changes**: Ghostty 1.3.0+ supports all four settings. `window-save-state = always` continues to restore full state on relaunch regardless of inheritance settings.
