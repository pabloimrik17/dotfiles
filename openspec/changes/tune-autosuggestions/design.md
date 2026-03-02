## Context

The dotfiles zshrc (`dot_zshrc.tmpl`) sources `zsh-autosuggestions` via Homebrew but applies no configuration. The plugin runs with defaults: synchronous suggestion lookup, no buffer size limit, and a faint grey highlight that blends into the catppuccin-mocha background (`#1e1e2e`). The terminal uses Ghostty with catppuccin-mocha theme and Hack Nerd Font.

## Goals / Non-Goals

**Goals:**

- Configure autosuggestion highlight color using catppuccin-mocha palette tokens (Mauve `#cba6f7` on Surface 2 `#585b70`)
- Enable async suggestion fetching to avoid input lag
- Cap suggestion buffer to skip lookups on long commands
- Include commented alternative color presets for quick switching

**Non-Goals:**

- Changing the autosuggestions plugin itself or its installation method
- Adding new zsh plugins or dependencies
- Configuring suggestion strategy (`match_prev_cmd`, `completion`, etc.)

## Decisions

### 1. Highlight style: `fg=#cba6f7,bg=#585b70` (Mauve on Surface 2)

The active style uses Mauve foreground with a Surface 2 background — both from catppuccin-mocha. This provides high visibility without the harsh full-inversion of `standout`. Two commented alternatives are included inline for quick switching:

- `fg=#9399b2` — Overlay 2, subtle grey (no background)
- `fg=#4d7d96` — Sapphire dimmed, oceanic tone (no background)

**Alternative considered**: Scott Spence's `fg=#663399,standout` — rejected because `#663399` is outside the catppuccin palette and `standout` inverts fg/bg, creating a selection-like highlight that's visually heavy.

### 2. Placement: after plugin source, before ALIASES section

The three `ZSH_AUTOSUGGEST_*` variables are placed immediately after the `zsh-syntax-highlighting` source block (line ~90) and before the ALIASES header (line ~92). This ensures the plugin is already loaded when settings are applied. The comment alternatives sit above the active line.

### 3. No `ZSH_AUTOSUGGEST_STRATEGY` override

The default strategy (`history`) is adequate. Changing to `match_prev_cmd` or `completion` has side effects (slower lookups, different suggestion quality) that warrant separate evaluation.

## Risks / Trade-offs

- **[bg color may render differently across terminals]** The `bg=` attribute in `ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE` depends on the terminal supporting 24-bit color. Ghostty supports this. If the config is applied in a terminal that doesn't, the background may be approximated to the nearest 256-color. **Mitigation**: catppuccin-mocha's Surface 2 (`#585b70`) maps cleanly to 256-color palette index 59, which is close enough.
