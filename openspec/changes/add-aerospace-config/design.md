## Context

Current setup: Rectangle for window management with manual fixed layouts. 3 screens (laptop + 2 external monitors), 7 desktops, ~14 windows, apps always in the same place. We are doing manually what a tiling WM automates.

## Goals / Non-Goals

**Goals:**
- Automatic window tiling (new windows place themselves)
- AeroSpace's own workspaces (1-7) with instant switching (no macOS animation)
- Vim-style navigation: alt+HJKL across windows, alt+shift+HJKL to move
- Automatic app-to-workspace assignment by bundle ID
- Workspace-to-monitor assignments for 3 screens
- Floating apps for Finder, calculator, dialogs
- TOML configuration versioned in dotfiles

**Non-Goals:**
- SketchyBar or another custom status bar (can come later)
- Advanced scripting with AeroSpace commands
- Large aesthetic gaps (omerxx-style with 350px outer)
- Multi-monitor dynamic reassignment

## Decisions

### AeroSpace over the alternatives
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| AeroSpace | Native macOS, TOML config, active, own workspaces | Relatively new | ✅ Chosen |
| yabai | More mature, more features | Requires SIP disabled for full features | Rejected |
| Amethyst | Simple, no config required | Less configurable, no own workspaces | Rejected |
| Rectangle | Already in use | Manual, no auto-tiling, no fast workspaces | Replaced |

### Workspace layout
```
Left monitor (external 1)    Center monitor (external 2)    Laptop
┌─────────────────────┐      ┌─────────────────────────┐    ┌──────────────┐
│  WS 1: Comms        │      │  WS 3: Code             │    │ WS 6: Music  │
│  WS 2: Browser      │      │  WS 4: Terminal         │    │ WS 7: Other  │
│                     │      │  WS 5: Tools/DB         │    │              │
└─────────────────────┘      └─────────────────────────┘    └──────────────┘
```

Note: this layout is illustrative. The user will need to adjust workspace→monitor assignments based on their actual physical setup and monitor identifiers.

### App assignments (illustrative)
```toml
# Comms -> WS 1
Slack, Teams, Telegram, WhatsApp → workspace 1

# Browser -> WS 2
Chrome, Firefox → workspace 2

# Code -> WS 3
WebStorm, VS Code → workspace 3

# Terminal -> WS 4
Ghostty → workspace 4

# Tools -> WS 5
Docker, DBeaver → workspace 5
```

The user will need to customize this based on their actual apps and preferences.

### Keybindings
- `alt+h/j/k/l` → navigate between windows (focus)
- `alt+shift+h/j/k/l` → move window in direction
- `alt+1-7` → switch to workspace
- `alt+shift+1-7` → move window to workspace
- `alt+f` → toggle floating
- `alt+m` → toggle fullscreen

No conflict with Karabiner (Karabiner uses Ctrl+HJKL, AeroSpace uses Alt+HJKL).

### Conservative gaps
Inner gaps: 8px. Outer gaps: 8px. Functional without being excessive. Omerxx uses 40px inner and 350px outer — too much for productivity.

### Floating apps
Finder, Calculator, System Preferences, 1Password, Archive Utility, any native macOS dialog.

## Risks / Trade-offs

- **[Learning curve ~1-2 weeks]** → Mitigation: Rectangle can stay installed during the transition. AeroSpace can be disabled temporarily.
- **[alt+key collisions with apps]** → Mitigation: alt is the least-used modifier on macOS (Cmd is the main one). Most apps do not use alt+hjkl.
- **[Monitor IDs may change]** → Mitigation: AeroSpace supports partial monitor-name patterns. We will document how to identify monitors.
- **[Aggressive tiling on apps that don't expect it]** → Mitigation: configurable floating apps list. Start conservative and adjust.
