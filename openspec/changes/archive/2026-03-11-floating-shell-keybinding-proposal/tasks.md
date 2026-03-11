## 1. Update Ghostty config

- [x] 1.1 Change keybind line in `dot_config/ghostty/config` from `global:super+shift+t=toggle_quick_terminal` to `global:ctrl+º=toggle_quick_terminal`

## 2. Verify

- [x] 2.1 Confirm Ghostty accepts `ctrl+º` syntax (no config errors on reload)
- [x] 2.2 Test Ctrl+º toggles quick terminal from another app
- [x] 2.3 Test Cmd+Shift+T still reopens closed tabs in Chrome
- [x] 2.4 Test Cmd+º still switches windows of the same app (not affected — our keybind uses ctrl, not cmd)
