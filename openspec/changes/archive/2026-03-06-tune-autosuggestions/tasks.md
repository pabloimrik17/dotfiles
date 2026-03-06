## 1. Add autosuggestions tuning block

- [x] 1.1 Insert autosuggestions tuning comment and settings after the zsh-syntax-highlighting source block (line ~90) and before the ALIASES section in `dot_zshrc.tmpl`
- [x] 1.2 Set `ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=#cba6f7,bg=#585b70"` as the active style
- [x] 1.3 Add commented alternative: `fg=#9399b2` (catppuccin-mocha Overlay 2 — subtle grey, no background)
- [x] 1.4 Add commented alternative: `fg=#4d7d96` (catppuccin-mocha Sapphire dimmed 50% — oceanic tone, no background)
- [x] 1.5 Set `ZSH_AUTOSUGGEST_BUFFER_MAX_SIZE=20`
- [x] 1.6 Set `ZSH_AUTOSUGGEST_USE_ASYNC=true`

## 2. Verify

- [x] 2.1 Run `chezmoi execute-template < dot_zshrc.tmpl` to confirm the template renders without errors
