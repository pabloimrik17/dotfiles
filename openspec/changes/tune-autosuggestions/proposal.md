## Why

The `zsh-autosuggestions` plugin is sourced but runs with default settings — no async, no buffer limit, and the default grey highlight style that lacks contrast on catppuccin-mocha. Adding three tuning variables improves responsiveness (async lookup, capped buffer) and visual coherence (Mauve on Surface 2 from the catppuccin-mocha palette), with commented alternatives for easy switching.

## What Changes

- Add `ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=#cba6f7,bg=#585b70"` (Mauve on Surface 2) with commented alternatives for Overlay 2 (`#9399b2`) and Sapphire dimmed (`#4d7d96`)
- Add `ZSH_AUTOSUGGEST_BUFFER_MAX_SIZE=20` to skip suggestion lookups for commands longer than 20 characters
- Add `ZSH_AUTOSUGGEST_USE_ASYNC=true` to fetch suggestions in the background without blocking input
- All settings placed after the plugin source block and before the ALIASES section in `dot_zshrc.tmpl`

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

_(none — no existing spec-level requirements change; this is configuration tuning within the existing zsh-autosuggestions plugin setup)_

## Impact

- **File**: `dot_zshrc.tmpl` — 6 new lines inserted between the Zsh plugins block (line ~90) and the ALIASES section (line ~92): 1 comment header, 2 commented alternative styles, 1 active highlight style, 1 buffer size, 1 async flag
- **Dependencies**: None — `zsh-autosuggestions` is already installed and sourced
- **Risk**: Minimal. All three variables are optional overrides; if removed, the plugin falls back to defaults silently
