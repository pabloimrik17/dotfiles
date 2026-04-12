## 1. Inline config edits (no new files or downloads)

- [x] 1.1 Add `--color` block to `FZF_DEFAULT_OPTS` in `dot_zshrc.tmpl` with official Catppuccin Mocha values
- [x] 1.2 Replace custom gh-dash colors in `dot_config/gh-dash/config.yml` with official Mocha blue port values (add `error` field, fix `warning` to yellow, update `secondary`/`inverted`/`faint`/borders)

## 2. New chezmoi-managed config files

- [x] 2.1 Create `dot_config/lazygit/config.yml` with official Catppuccin Mocha blue theme under `gui.theme` and `authorColors`
- [x] 2.2 Create `dot_config/eza/theme.yml` with full official Catppuccin Mocha blue theme (file kinds, permissions, sizes, git status, etc.)

## 3. Config edits for downloaded themes

- [x] 3.1 Add `[include] path = ~/.config/delta/catppuccin.gitconfig` and `features = catppuccin-mocha` to `[delta]` section in `dot_gitconfig.tmpl`
- [x] 3.2 Add `source ~/.zsh/catppuccin_mocha-zsh-syntax-highlighting.zsh` guard line in `dot_zshrc.tmpl` before oh-my-zsh sourcing
- [x] 3.3 Add `[theme] name = "catppuccin-mocha-blue"` to `dot_config/atuin/config.toml`
- [x] 3.4 Add Catppuccin plugin config to `dot_tmux.conf`: flavor mocha, rounded windows, status line with application + session modules

## 4. Install script — theme downloads

- [x] 4.1 Add delta theme download section: fetch `catppuccin.gitconfig` to `~/.config/delta/catppuccin.gitconfig`
- [x] 4.2 Add zsh-syntax-highlighting theme download section: fetch `.zsh` file to `~/.zsh/catppuccin_mocha-zsh-syntax-highlighting.zsh`
- [x] 4.3 Add atuin theme download section: fetch `.toml` to `~/.config/atuin/themes/catppuccin-mocha-blue.toml`
- [x] 4.4 Add tmux plugin clone section: shallow clone `catppuccin/tmux` at `v2.3.0` to `~/.config/tmux/plugins/catppuccin/tmux/`

## 5. Verification

- [ ] 5.1 Run `chezmoi apply --dry-run` to verify all managed files deploy correctly
- [ ] 5.2 Open each tool (fzf, lazygit, tmux, delta diff, eza, gh-dash, atuin) and confirm Catppuccin Mocha colors render
