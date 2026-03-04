## Context

The dotfiles repo manages terminal configuration via chezmoi. The current `dot_config/starship.toml` contains only Nerd Font symbol overrides (the preset). Ghostty (`dot_config/ghostty/config`) uses `theme = catppuccin-mocha`, which maps ANSI colors to catppuccin values. Starship modules use their own hardcoded default styles (e.g., `bold purple`, `bold cyan`) that happen to look reasonable through Ghostty's ANSI mapping but are not intentionally catppuccin-aligned.

The `dot_zshrc.tmpl` has no BAT_THEME set. The `tune-autosuggestions` change (in-flight) already uses catppuccin hex values with inline comments for zsh autosuggestion styling.

## Goals / Non-Goals

**Goals:**
- Intentional catppuccin-mocha color integration via Starship's native palette system
- Repo-aware directory paths and count-aware git status
- Consistent catppuccin theming across bat and delta via BAT_THEME
- Reduce prompt noise by disabling modules for VCS systems not in use

**Non-Goals:**
- Multi-line prompt format or custom `format` string
- Full catppuccin style overrides on every module (selective overrides only)
- Managing delta/gitconfig (BAT_THEME inheritance handles this)
- Theme switching mechanism (one palette, swap the name if needed later)
- Disabling language detection modules (auto-detect is kept for all programming languages)

## Decisions

### D1: Palette + selective overrides (not full catppuccin restyling)

Define the full `[palettes.catppuccin_mocha]` color table but only override styles on 3 modules: `directory` (sapphire), `git_branch` (mauve), `git_status` (red for the style). All other modules keep their ANSI default styles, which Ghostty already maps to catppuccin.

**Why not full override:** Most modules already look correct through Ghostty's ANSI mapping. Overriding every module's style would increase config size 3x for marginal visual difference, and would tightly couple every module to the palette.

**Why not ANSI-only:** ANSI `purple` maps to mauve and `cyan` maps to sky — but we want sapphire for directory (subtly different from sky). The palette gives precise control where it matters without requiring it everywhere.

### D2: Keep language modules, disable exotic VCS/cloud

Disabled: `hg_branch`, `fossil_branch`, `pijul_channel`, `conda`, `guix_shell`, `nix_shell` — tools not installed or used.

Kept with auto-detect: `python`, `rust`, `golang`, `java`, `ruby`, `nodejs`, etc. — these only appear when a project marker file is detected (Cargo.toml, go.mod, etc.), have zero cost when not triggered, and provide useful context when reviewing unfamiliar codebases.

**Why not disable cloud modules (aws, gcloud):** These only show when env vars or config files are present. If active credentials exist, seeing the active profile/project is a feature, not noise.

### D3: BAT_THEME in this change, not a separate zshrc change

BAT_THEME is conceptually part of "catppuccin theming across CLI tools" — the same motivation as the starship palette. Placing it in a separate change would split a cohesive theming story across two PRs. It's a single `export` line in `dot_zshrc.tmpl`.

### D4: Hex values in zsh, named colors in starship

Each tool uses its native color mechanism. Starship has palettes → use named colors. Zsh has no palette system → use hex with a comment noting the catppuccin name (e.g., `# catppuccin: mauve on surface2`). No abstraction layer between them.

## Risks / Trade-offs

- **Palette coupling** → Mitigated: switching themes requires changing `palette = 'catppuccin_mocha'` and adding a new `[palettes.x]` block. Only 3 module styles reference palette names.
- **Starship version dependency** → `palette` feature requires Starship 1.11+. Assuming Homebrew install in `run_once_install-packages.sh.tmpl` provides 1.11+, the palette will work as expected. Guardrail: verify `starship --version` >= 1.11 and validate TOML syntax with `starship config` at deploy time.
- **BAT_THEME value must match exactly** → `"Catppuccin Mocha"` is the built-in bat theme name (case-sensitive, space-separated). Guardrail: verify theme availability with `bat --list-themes | grep "Catppuccin Mocha"` at deploy time.
