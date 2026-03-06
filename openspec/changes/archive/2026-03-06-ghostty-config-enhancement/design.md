## Context

The Ghostty config at `dot_config/ghostty/config` is a 45-line static file managed via chezmoi, deployed only on macOS (guarded by `.chezmoiignore.tmpl`). It covers: catppuccin-mocha theme, Hack Nerd Font at 14pt, window padding/decoration, block cursor without blink, zsh shell integration (cursor, sudo, title), copy-on-select, mouse-hide-while-typing, and macOS tab navigation keybinds.

The config is a plain file (not `.tmpl`) because it contains no machine-specific variables. The user has a Spanish (Spain) keyboard layout, uses dark mode exclusively, and does not currently SSH to remote machines.

Ghostty 1.2.0 introduced several features (quick terminal, background image, link previews, SSH integration, bell features) that expand the configuration surface significantly.

## Goals / Non-Goals

**Goals:**

- Add visual refinements that improve terminal aesthetics on macOS Retina without changing the theme or font
- Enable quick terminal for fast access from any application
- Improve daily UX: cursor navigation, clipboard hygiene, window state persistence
- Add operational safety nets: contrast protection, secure input, update notifications
- Maintain the existing config structure and organization style (commented sections)

**Non-Goals:**

- Light/dark theme switching (user is dark-mode only)
- Changing `macos-option-as-alt` (Spanish keyboard requires Option for `@`, `#`, `[`, `]`, `{`, `}`, `|`, `\`, `~`)
- SSH shell integration features (no current SSH usage)
- Background images, custom shaders, or other heavy visual features
- Converting config to a chezmoi template (no machine-specific values needed)
- Changing existing keybindings or shell integration settings

## Decisions

### Decision: Config remains a static file

**Choice**: Keep `dot_config/ghostty/config` as a plain file, not `.tmpl`.

**Rationale**: None of the new options require machine-specific values. All additions are static values that apply uniformly. The archived `setup-dotfiles` design noted `font-size` as a potential future template candidate for different monitors, but this change doesn't address that.

**Alternative considered**: Template with chezmoi data for font-size per machine. Rejected because there's only one machine profile currently and the added complexity isn't warranted.

### Decision: Quick terminal keybind is `super+shift+t`

**Choice**: `global:super+shift+t=toggle_quick_terminal`

**Rationale**: On a Spanish macOS keyboard layout, many common "Quake console" keybinds are problematic:

- `super+grave` conflicts with macOS "switch windows of same app"
- `ctrl+grave` -- the grave accent (`` ` ``) is awkward on Spanish keyboards
- `ctrl+space` may conflict with Spotlight or input source switching

`super+shift+t` is: memorable (T for Terminal), ergonomic (left hand), and collision-free with both macOS shortcuts and existing Ghostty keybinds. Note that `super+t` (without shift) is already bound to `new_tab`.

**Alternative considered**: A function key like `F12`. Rejected as less memorable and harder to reach.

### Decision: New options are appended in themed sections

**Choice**: Add new configuration lines following the existing commented-section pattern (`# Section Name`), grouped logically.

**Rationale**: The current config uses `# Theme`, `# Font`, `# Window`, `# Cursor`, etc. as section headers. New options are integrated into existing logical sections where they belong (e.g., `font-thicken` under `# Font`, `window-save-state` under `# Window`, `clipboard-trim-trailing-spaces` under `# Copy/paste`). Dedicated sections are added only for genuinely new feature groups: `# Quick terminal`, `# Quick reload config`, and `# Operational`. This keeps related settings together and the file scannable.

### Decision: `minimum-contrast` set to 1.1 (not higher)

**Choice**: `minimum-contrast = 1.1`

**Rationale**: A value of 1.1 is the minimum to prevent completely invisible text (same fg/bg). Higher values (3+) enforce WCAG readability but risk distorting the catppuccin palette by forcing colors toward black/white. Since catppuccin-mocha is well-designed with adequate contrast, 1.1 is a safety net, not an accessibility enforcement.

### Decision: `window-save-state = always` instead of `default`

**Choice**: Explicit `always` rather than the macOS default behavior.

**Rationale**: The `default` setting on macOS only saves state on force-quit or if systemwide configured. With `always`, window layout is preserved on every clean exit. This is a better default for a power user who may have complex tab/split arrangements. The downside is slightly more disk I/O on quit, which is negligible.

## Risks / Trade-offs

**[Quick terminal requires Accessibility permissions]** The `global:` keybind prefix requires granting Ghostty Accessibility permissions in System Settings > Privacy & Security > Accessibility. Without this, the quick terminal keybind silently won't work. Ghostty will prompt for permissions on first use.

**[`window-save-state = always` may restore unwanted sessions]** If you quit Ghostty with many temporary tabs open, they'll all reopen next time. Mitigation: this is the expected behavior and can be changed to `never` or `default` if it becomes annoying.

**[`font-thicken` is subjective]** Some users prefer thinner font rendering. This can be toggled off if the thicker strokes don't suit the user's taste. The setting only applies to macOS.

**[Config file grows from 45 to ~65 lines]** Still well within manageable size. The section-header organization keeps it navigable.
