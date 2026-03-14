## Context

Ghostty 1.3.0 introduced granular `*-inherit-working-directory` settings for windows, tabs, and splits (replacing the single legacy `window-inherit-working-directory`). The current config sets all three to `true`. The user's workflow shows ~60% of new tabs are for fresh contexts, while splits serve the "more space in the same project" need. Zoxide is already configured for fast directory jumping.

## Goals / Non-Goals

**Goals:**

- New windows and tabs open at `$HOME` for a clean starting point
- Splits continue inheriting the current surface's working directory
- Explicit `working-directory = home` for consistent behavior across all launch methods (Dock, Spotlight, CLI)

**Non-Goals:**

- Changing quick terminal behavior (it uses `working-directory` as its base, which will naturally become `home`)
- Adding custom keybinds or scripts for directory management — zoxide already covers this
- Changing any other UX settings in the same config section

## Decisions

### Use `home` instead of a custom path for `working-directory`

`working-directory = home` uses `$HOME` (`/Users/etherless`). An alternative was a project-specific path like `~/Projects`, but `$HOME` is the most universal starting point and aligns with standard terminal behavior. Zoxide handles fast navigation from home to any recent directory.

### Disable inheritance for both windows AND tabs

An alternative was keeping tab inheritance (`true`) and only disabling window inheritance. However, since 60% of tabs are new-context, the majority case wins as the default. The 40% "same project" need is already served by splits (which inherit) and zoxide (for the rare tab-in-same-project case).

## Risks / Trade-offs

- **Muscle memory adjustment**: Users accustomed to tabs inheriting directories will need to use `z <project>` or splits instead. → Mitigation: zoxide is already configured and well-practiced.
- **Quick terminal changes behavior**: Currently inherits; will now always open at `$HOME`. → Mitigation: This is actually desirable — quick terminal is a scratchpad, home is a good default.
