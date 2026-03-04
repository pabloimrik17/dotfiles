## Why

The current Ghostty configuration covers basic setup (theme, font, window, cursor, keybinds) but leaves significant UX and visual improvements on the table. Ghostty 1.2.0 introduced features like quick terminal, window state persistence, and visual refinements that would meaningfully improve the daily terminal workflow on macOS.

## What Changes

**Visual polish:**
- Add `window-padding-balance = true` to distribute leftover pixel padding evenly across edges
- Add `window-padding-color = extend` to extend cell background color into padding (eliminates visible seams)
- Add `font-thicken = true` for improved font rendering on macOS Retina displays

**UX improvements:**
- Add `cursor-click-to-move = true` to enable Option+click cursor positioning at shell prompts
- Add `window-save-state = always` to restore windows, tabs, splits, and working directories on restart
- Add `clipboard-trim-trailing-spaces = true` to strip trailing whitespace when copying
- Add `minimum-contrast = 1.1` as a safety net against invisible text (same fg/bg color)

**Quick terminal (drop-down Quake-style terminal):**
- Add `quick-terminal-position = top` with 40% screen height
- Add global keybind (`super+shift+t`) to toggle quick terminal from any application
- Configure animation, screen selection, and auto-hide behavior

**Operational:**
- Add `auto-update = check` to get notified of Ghostty updates
- Add `macos-auto-secure-input = true` for automatic secure keyboard on password prompts
- Add `window-inherit-working-directory = true` so new tabs/splits inherit the current directory
- Add `confirm-close-surface = true` to make the default explicit
- Add `link-previews = true` for URL preview on hover

**Explicitly NOT changing:**
- Theme stays `catppuccin-mocha` (dark only, no light/dark auto-switching)
- Font stays `Hack Nerd Font` at size 14
- `macos-option-as-alt` is NOT set (Spanish keyboard layout uses Option for `@`, `#`, `[`, `]`, `{`, `}`, `|`, `\`, `~`)
- SSH shell integration features deferred (no current SSH usage; revisit when Raspberry Pi setup resumes)
- Existing keybindings preserved as-is

## Capabilities

### New Capabilities

- `ghostty-visual-polish`: Window padding, font rendering, and contrast settings for a refined macOS terminal appearance
- `ghostty-quick-terminal`: Drop-down Quake-style terminal accessible via global hotkey from any application
- `ghostty-ux-enhancements`: Cursor interaction, clipboard behavior, window state persistence, and operational settings

### Modified Capabilities

_(No existing specs in `openspec/specs/` for ghostty-config; the original spec lives only in the archived `setup-dotfiles` change)_

## Impact

- **File modified**: `dot_config/ghostty/config` (adding ~20 new configuration lines)
- **No new files**: All changes are additions to the existing config file
- **No template conversion**: Config remains a plain static file (not `.tmpl`)
- **macOS permissions**: Quick terminal's global keybind requires Accessibility permissions in System Preferences > Privacy & Security > Accessibility
- **Runtime behavior**: `window-save-state = always` changes Ghostty's exit behavior (saves state on every quit, not just force-quit)
