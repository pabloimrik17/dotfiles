## 1. Replace fzf initialization in dot_zshrc.tmpl

- [ ] 1.1 Remove `[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh` (line 53) and its comment (line 52)
- [ ] 1.2 Add arch-conditional fzf PATH block using chezmoi `os`/`arch` templates (ARM: `/opt/homebrew/opt/fzf/bin`, Intel: `/usr/local/opt/fzf/bin`)
- [ ] 1.3 Add `source <(fzf --zsh)` for inline keybinding and completion loading
- [ ] 1.4 Verify the new block sits before the existing FZF_DEFAULT_COMMAND/FZF_DEFAULT_OPTS configuration (lines 56-70)

## 2. Verify

- [ ] 2.1 Run `chezmoi diff` to confirm only the fzf init block changed — no unintended modifications
- [ ] 2.2 Run `chezmoi apply --dry-run` to confirm template renders without errors
