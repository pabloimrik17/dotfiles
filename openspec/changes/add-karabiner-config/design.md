## Context

There is no keyboard remapping in the current dotfiles. macOS natively supports Caps Lock → modifier in System Settings, but advanced remaps (Ctrl+HJKL → arrows) require Karabiner-Elements. Reference: omerxx/dotfiles includes a Karabiner config with exactly these remaps.

## Goals / Non-Goals

**Goals:**
- Remap Caps Lock → Left Control (system-wide)
- Remap Ctrl+HJKL → Arrow keys (vim-style navigation across all apps)
- JSON configuration versioned in dotfiles, managed by Chezmoi
- Automated install via brew cask

**Non-Goals:**
- Complex Hyper-key style remaps (Caps Lock as Ctrl+Shift+Cmd+Alt)
- App-specific remaps
- Backslash → Delete (from omerxx, too opinionated)
- QMK-style layer system

## Decisions

### Config structure
Karabiner uses `~/.config/karabiner/karabiner.json`. In Chezmoi this becomes `dot_config/karabiner/karabiner.json`. It is not a template (no Chezmoi variables needed).

### Remap 1: Caps Lock → Left Control
Implemented as a `simple_modification` in Karabiner (the most basic kind). Caps Lock loses its original function entirely.
- **Alternative:** native macOS (System Settings → Keyboard → Modifier Keys) → rejected because it is not versionable in dotfiles and cannot be combined with Karabiner rules.
- **Alternative:** Dual-role (Caps alone = Escape, Caps+key = Ctrl) → rejected for complexity and perceptible latency.

### Remap 2: Ctrl+HJKL → Arrow keys
Implemented as a `complex_modification` with rules. Both Left Control and Right Control + HJKL are mapped. This enables:
- Caps Lock (now Ctrl) + HJKL → arrows (the primary flow)
- Original Ctrl + HJKL → arrows (just in case)

### Scope: only HJKL, not JK for scrolling
Arrow keys only. We do not add Ctrl+D/U for Page Down/Up or other vim remaps. KISS.

## Risks / Trade-offs

- **[Caps Lock disappears]** → Low risk: almost no one uses it. If needed, Shift+Caps Lock still works in Karabiner.
- **[Ctrl+H conflict in apps]** → Some apps use Ctrl+H (backspace in terminal, help in some programs). Mitigation: most modern apps use Cmd+H. If a real conflict appears, specific apps can be excluded by bundle ID.
- **[Karabiner requires accessibility permissions]** → Expected; documented in the install script as a manual post-install step.
- **[Input latency]** → Karabiner operates at the kernel level; latency is imperceptible (<1ms).
