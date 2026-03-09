## Context

Ghostty 1.3.0 shipped new config options. Current config uses the legacy single `window-inherit-working-directory` option and lacks notification/scrollbar settings. All changes target `dot_config/ghostty/config`.

## Goals / Non-Goals

**Goals:**

- Adopt command-finish notifications for long-running commands
- Use native macOS overlay scrollbar
- Migrate to granular WD inheritance (tab/split/window)

**Non-Goals:**

- Key tables, modal keybindings, key remapping
- New keybind actions (close_tab:right, toggle_background_opacity)
- scroll-to-bottom behavior change
- selection-word-chars customization
- Theme or font changes

## Decisions

### Add notifications section after Mouse section

Rationale: logical grouping — notifications are a UX feature adjacent to mouse/cursor behavior. Place between Mouse and Quick Terminal sections.

Config:

```
notify-on-command-finish = unfocused
notify-on-command-finish-action = notify
notify-on-command-finish-after = 10s
```

`unfocused` over `always`: no need to notify when terminal is focused and visible. `notify` action enables macOS desktop notifications (default is `bell` only). 10s threshold avoids noise from quick commands. Requires shell integration with OSC 133 for command boundary detection (already configured via `shell-integration = zsh`).

### Add scrollbar in Window section

Rationale: scrollbar is a window-level visual setting. Add after `window-padding-color = extend`.

Config:

```
scrollbar = system
```

`system` over `off`: leverages native macOS overlay scrollbar (appears on scroll, auto-hides). Clean look without losing scroll position feedback.

### Replace single WD inheritance with 3 granular options

Rationale: 1.3.0 introduced granular control. Replace `window-inherit-working-directory = true` with explicit per-surface-type settings. All set to true to preserve current behavior.

Config:

```
tab-inherit-working-directory = true
split-inherit-working-directory = true
window-inherit-working-directory = true
```

## Risks / Trade-offs

- [Ghostty version < 1.3.0] → unknown keys are ignored with non-fatal config warnings (not breaking). Users should upgrade to Ghostty >= 1.3.0 before applying this config update to avoid warning noise
- [Notification noise] → 10s threshold mitigates; `unfocused` only fires when not looking at terminal
