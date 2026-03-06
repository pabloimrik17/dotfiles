## 1. Visual Polish

- [x] 1.1 Add `window-padding-balance = true` to the Window section of `dot_config/ghostty/config`
- [x] 1.2 Add `window-padding-color = extend` to the Window section
- [x] 1.3 Add `font-thicken = true` to the Font section
- [x] 1.4 Add `minimum-contrast = 1.1` as a new Visual section or alongside theme settings

## 2. Quick Terminal

- [x] 2.1 Add a `# Quick terminal` section to `dot_config/ghostty/config`
- [x] 2.2 Add `quick-terminal-position = top`
- [x] 2.3 Add `quick-terminal-size = 40%`
- [x] 2.4 Add `quick-terminal-screen = main`
- [x] 2.5 Add `quick-terminal-animation-duration = 0.2`
- [x] 2.6 Add `quick-terminal-space-behavior = move`
- [x] 2.7 Add `quick-terminal-autohide = true`
- [x] 2.8 Add `keybind = global:super+shift+t=toggle_quick_terminal` to the Keybindings section
- [x] 2.9 Verify macOS Accessibility permission is granted for Ghostty (System Settings > Privacy & Security > Accessibility) to enable `global:` keybinds

## 3. UX Enhancements

- [x] 3.1 Add `cursor-click-to-move = true` to the Cursor section
- [x] 3.2 Add `window-save-state = always` to the Window section
- [x] 3.3 Add `clipboard-trim-trailing-spaces = true` to the Copy/paste section
- [x] 3.4 Add `window-inherit-working-directory = true` to the Window section
- [x] 3.5 Add `confirm-close-surface = true` to a new UX or Window section
- [ ] ~~3.6 Add `link-previews = true` alongside URL/link settings~~ — **cancelled**: option does not exist in Ghostty 1.2.3

## 4. Operational

- [x] 4.1 Add `auto-update = check` to a new Operational section
- [x] 4.2 Add `macos-auto-secure-input = true` to the Operational or macOS section
