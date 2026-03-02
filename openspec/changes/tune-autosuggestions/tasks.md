## 1. Add autosuggestions tuning block

- [ ] 1.1 Insert autosuggestions tuning comment and settings after the zsh-syntax-highlighting source block (line ~90) and before the ALIASES section in `dot_zshrc.tmpl`
- [ ] 1.2 Set `ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=#cba6f7,bg=#585b70"` as the active style
- [ ] 1.3 Add commented alternative: `fg=#9399b2` (catppuccin-mocha Overlay 2 — subtle grey, no background)
- [ ] 1.4 Add commented alternative: `fg=#4d7d96` (catppuccin-mocha Sapphire dimmed 50% — oceanic tone, no background)
- [ ] 1.5 Set `ZSH_AUTOSUGGEST_BUFFER_MAX_SIZE=20`
- [ ] 1.6 Set `ZSH_AUTOSUGGEST_USE_ASYNC=true`

## 2. Verify

- [ ] 2.1 Run `chezmoi execute-template < dot_zshrc.tmpl` to confirm the template renders without errors
