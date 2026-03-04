# Exploration: Starship Prompt Enhancement

## Context

The current `dot_config/starship.toml` is a verbatim copy of the **Nerd Font Symbols Preset** — it only overrides icon symbols for ~40 modules. No formatting, no colors, no behavioral tuning. Starship falls back to its built-in defaults for everything else.

The terminal uses **Ghostty** with **catppuccin-mocha** theme, which handles base terminal colors. But Starship's own color/style system operates independently — Ghostty gives us the 16 ANSI colors, but Starship modules use their own hardcoded default styles (e.g., `git_branch` defaults to `bold purple`, `directory` defaults to `bold cyan`).

## What the Preset Gives Us (and What It Doesn't)

```
┌──────────────────────────────────────────────────────────────┐
│              NERD FONT SYMBOLS PRESET                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ PROVIDES              ❌ DOES NOT PROVIDE               │
│  ─────────────            ───────────────────                │
│  Icon symbols for:        Format strings                     │
│  - git_branch  (" ")     Color/style overrides              │
│  - nodejs  (" ")         Directory truncation               │
│  - directory  ("󰌾")      git_status symbols                 │
│  - docker  (" ")         character (success/error)          │
│  - 36 more modules...     cmd_duration config                │
│                            Module enable/disable              │
│                            Palette definitions                │
│                            Line break behavior                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## What's Worth Adding

### 1. Directory Truncation and Repo Awareness

**Current behavior (Starship defaults):** Truncates to 3 components, no repo awareness.

**Proposed:**
```toml
[directory]
read_only = " 󰌾"           # Already from preset
truncation_length = 3        # Keep default (3 is good)
truncation_symbol = "…/"     # Show truncation happened
truncate_to_repo = true      # Inside a git repo, show path relative to repo root
home_symbol = "~"            # Explicit
```

**Why:** `truncate_to_repo = true` is the real win. Inside a git repo, instead of showing `…/src/components`, it shows `repo-name/src/components`. You always know WHERE you are relative to the project root.

### 2. Git Status Symbols

**Current behavior:** Starship defaults use `[!+?⇡⇣⇕]` which are fine but verbose with brackets.

**Proposed:**
```toml
[git_status]
format = '([$all_status$ahead_behind]($style) )'
modified = "●"       # Cleaner than default *
untracked = "?"      # Keep default
staged = "+"         # Keep default
conflicted = "!"     # Keep default (critical to see)
ahead = "⇡${count}"  # Show HOW MANY commits ahead
behind = "⇣${count}" # Show HOW MANY commits behind
diverged = "⇕⇡${ahead_count}⇣${behind_count}"  # Full divergence info
stashed = "≡"        # Show stash exists
deleted = "✘"        # Explicit deletion marker
renamed = "»"        # Renamed files
```

**Why:** The `${count}` variables in ahead/behind are genuinely useful — knowing you're "3 commits ahead" vs "37 commits ahead" changes your behavior. The `stashed` indicator prevents forgotten stashes.

### 3. Character Module (Success/Error Prompt)

**Current behavior:** Default `❯` green/red.

**Proposed:**
```toml
[character]
success_symbol = '[❯](bold green)'
error_symbol = '[❯](bold red)'
vimcmd_symbol = '[❮](bold green)'
```

**Why:** Explicit is better than implicit. Also adds vi-mode awareness if user ever enables it.

### 4. Command Duration

**Current behavior:** Shows for commands > 2 seconds, default format.

**Proposed:**
```toml
[cmd_duration]
min_time = 2_000           # Show after 2s (default)
format = ' [$duration]($style) '
style = 'yellow'
show_milliseconds = false   # Keep it clean
```

**Why:** Minimal change but making it explicit prevents surprises if Starship changes defaults.

### 5. Catppuccin Mocha Palette Integration

Starship supports custom palettes natively. Instead of using ANSI color names (which depend on terminal theme), we can use exact catppuccin-mocha hex values.

**Proposed:**
```toml
palette = 'catppuccin_mocha'

# Only override styles that benefit from exact colors.
# Most modules look fine with ANSI defaults + Ghostty's catppuccin.

[git_branch]
symbol = " "                    # From preset
style = "bold mauve"             # Catppuccin mauve instead of generic purple

[directory]
style = "bold sapphire"          # Catppuccin sapphire instead of generic cyan

[palettes.catppuccin_mocha]
rosewater = "#f5e0dc"
flamingo = "#f2cdcd"
pink = "#f5c2e7"
mauve = "#cba6f7"
red = "#f38ba8"
maroon = "#eba0ac"
peach = "#fab387"
yellow = "#f9e2af"
green = "#a6e3a1"
teal = "#94e2d5"
sky = "#89dceb"
sapphire = "#74c7ec"
blue = "#89b4fa"
lavender = "#b4befe"
text = "#cdd6f4"
subtext1 = "#bac2de"
subtext0 = "#a6adc8"
overlay2 = "#9399b2"
overlay1 = "#7f849c"
overlay0 = "#6c7086"
surface2 = "#585b70"
surface1 = "#45475a"
surface0 = "#313244"
base = "#1e1e2e"
mantle = "#181825"
crust = "#11111b"
```

**Decision point:** Full catppuccin palette (exact colors everywhere) vs. ANSI-only (let Ghostty's theme handle it).

- **Full palette PRO:** Pixel-perfect catppuccin everywhere, consistent across terminals
- **Full palette CON:** Larger config, couples starship to catppuccin (switching themes means editing starship.toml too)
- **ANSI-only PRO:** Terminal theme controls everything, starship config is theme-agnostic
- **ANSI-only CON:** Some modules might look slightly off since Starship's default style names don't map 1:1 to catppuccin intent

**Recommendation:** Use the palette but only override 3-4 module styles where it matters (`directory`, `git_branch`, `git_status`). Leave the rest as ANSI defaults. This gives the "catppuccin polish" without over-coupling.

### 6. BAT_THEME Environment Variable

Not Starship per se, but related to tool theming consistency:

```zsh
export BAT_THEME="Catppuccin Mocha"
```

**bat already has catppuccin built-in.** Currently no BAT_THEME is set, so bat uses its default (probably `ansi` or `Monokai Extended`). Since delta uses bat's syntax engine, this also affects `git diff` rendering.

This belongs in `dot_zshrc.tmpl` rather than starship.toml, but is part of the same theming story.

### 7. Modules to Explicitly Disable

Starship auto-detects tons of modules. In a JS/TS-focused workflow, most language modules are noise:

```toml
# Disable modules we don't use to reduce prompt clutter
[aws]
disabled = true       # Unless actively using AWS CLI

[gcloud]
disabled = true       # Unless actively using gcloud

[python]
disabled = true       # Enable if doing Python work

[rust]
disabled = true       # Enable if doing Rust work

[golang]
disabled = true       # Enable if doing Go work

[java]
disabled = true       # Enable if doing Java work

[ruby]
disabled = true       # Enable if doing Ruby work
```

**Decision point:** This is opinionated. Auto-detection is fine if you occasionally touch these languages. Disabling reduces prompt "surprises" (entering a directory with a Cargo.toml suddenly showing Rust version). Preference call.

## What NOT to Add

| Feature | Why Not |
|---------|---------|
| Custom `format` string (multi-line prompt) | Adds complexity, default single-line is clean |
| `[time]` module | Terminal tab/window already shows time. Clutters prompt |
| `[username]` / `[hostname]` | Only useful for SSH. Default behavior (show only on SSH) is correct |
| `[os]` module | Decorative, no utility on a single-OS setup |
| `[memory_usage]` | Niche, Activity Monitor exists |
| `directory.substitutions` | Cute but brittle ("Documents" → "📄") |
| Theme switching (cyberpunk/pastel) | Ghostty handles terminal theme. One starship config is enough |
| Powerline/bracket segment format | Heavier rendering, preference for minimal default format |

## Proposed Change Shape

```
dot_config/starship.toml changes:
  - Keep all Nerd Font Symbols preset entries (icons)
  + Add [directory] truncation + truncate_to_repo
  + Add [git_status] with count-aware ahead/behind + stashed
  + Add [character] explicit success/error
  + Add [cmd_duration] explicit config
  + Add [palettes.catppuccin_mocha] palette
  + Add palette = 'catppuccin_mocha' at top
  + Override style on [directory] and [git_branch] to use palette names
  + Optionally disable unused language modules

dot_zshrc.tmpl side-effect:
  + Add export BAT_THEME="Catppuccin Mocha"
```

## Open Questions

1. **Palette coupling vs ANSI simplicity** — How many module styles to override with catppuccin names?
2. **Language module disabling** — Opinionated. Disable all non-JS/TS or leave auto-detect?
3. **BAT_THEME** — Goes in this change or the main zshrc change?
4. **delta syntax-theme** — Should delta's gitconfig also reference `Catppuccin Mocha` as syntax theme? (Currently uses Starship defaults, bat has catppuccin, delta CAN use it)
