## Why

Ghostty 1.3.0 introduces new config options for notifications, scrollbar control, and granular working directory inheritance. Our config should adopt the relevant ones to improve productivity (command-finish notifications) and use the new granular WD inheritance API instead of the single legacy option.

## What Changes

- Add `notify-on-command-finish = unfocused` and `notify-on-command-finish-after = 10s` for long-running command notifications
- Add `scrollbar = system` to use native macOS overlay scrollbars
- **BREAKING**: Replace `window-inherit-working-directory = true` with 3 granular options: `tab-inherit-working-directory`, `split-inherit-working-directory`, `window-inherit-working-directory` (all true, same behavior but explicit for 1.3.0 API)

## Capabilities

### New Capabilities

- `ghostty-command-notifications`: Command-finish notification settings (when to notify, threshold duration)

### Modified Capabilities

- `ghostty-ux-enhancements`: Add scrollbar preference and granular working directory inheritance (replacing single `window-inherit-working-directory`)

## Impact

- `dot_config/ghostty/config` — only file affected
- No theme changes, no keybinding changes, no shell integration changes
