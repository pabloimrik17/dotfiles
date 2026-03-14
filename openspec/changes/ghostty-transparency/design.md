## Context

The Ghostty config (`dot_config/ghostty/config`) is organized in clearly labeled sections: Theme, Font, Window, Cursor, etc. There are no transparency settings. The existing `minimum-contrast = 1.1` acts as a safety net for readability. The theme is `catppuccin-mocha` (dark, `#1e1e2e` background). The user typically has a desktop wallpaper with icons/folders behind the terminal.

Values were explored live by editing `~/.config/ghostty/config` and reloading with `super+shift+,`.

## Goals / Non-Goals

**Goals:**

- Add background opacity and blur to the Ghostty config with the chosen values (0.96 / blur 12)
- Document alternative presets as comments so future tweaking doesn't require re-exploration

**Non-Goals:**

- Per-machine conditional config (chezmoi templates) — values are unified across machines
- Modifying any other visual settings

## Decisions

### Placement: After `# Theme`, before `# Font`

Transparency is a visual/theme-adjacent property. Placing it right after the theme section groups all appearance settings together.

### Chosen values: `background-opacity = 0.96`, `background-blur = 12`

Explored live on macOS with catppuccin-mocha over a desktop with icons. This combo gives a subtle depth effect — darker than the other machine's 0.94 — while blur 12 sufficiently diffuses desktop icons.

Alternatives considered (documented as comments in config):

- `0.90 / 10` — ambient tint, too transparent for preference
- `0.94 / 12` — the other machine's config, slightly too light
- `0.97 / 16` — very subtle, liked but less preferred than 0.96/12

### Comment format: Presets as commented alternatives

Each alternative gets a one-line comment with values and description, making it trivial to swap.

## Risks / Trade-offs

- **Platform portability**: `background-blur` is macOS-only. On Linux, Ghostty silently ignores it → No mitigation needed, behavior is safe.
- **Wallpaper dependency**: The effect looks different depending on wallpaper colors. With very bright wallpapers, 0.96 might wash out text → `minimum-contrast = 1.1` mitigates this.
