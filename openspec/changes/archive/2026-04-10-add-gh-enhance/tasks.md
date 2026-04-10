## 1. Installation

- [x] 1.1 Add `gh-enhance` to the gh CLI extensions group in `run_onchange_install-packages.sh.tmpl` with idempotency check via `gh extension list | grep -q "dlvhdr/gh-enhance"`
- [x] 1.2 Add `alias ghe='ENHANCE_THEME=catppuccin_mocha gh enhance'` to `dot_zshrc.tmpl` in the GitHub aliases section

## 2. gh-dash Integration

- [x] 2.1 Add `T` keybinding (tmux) to prs section in `dot_config/gh-dash/config.yml`
- [x] 2.2 Add `t` keybinding (inline) to prs section in `dot_config/gh-dash/config.yml`

## 3. Verification

- [x] 3.1 Run `chezmoi diff` to confirm modified files are detected
- [x] 3.2 Verify `gh enhance` installs and launches correctly (deferred to post-apply)
