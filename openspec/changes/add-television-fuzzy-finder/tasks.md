## 1. Installation

- [x] 1.1 Add `television` to `BREW_PACKAGES` array in `run_onchange_install-packages.sh.tmpl`
- [x] 1.2 Add `television` → `tv` mapping to `pkg_bin()` function
- [x] 1.3 Add `tv update-channels` post-install step after brew packages group (guarded by `command -v tv`)

## 2. Configuration files

- [x] 2.1 Download `catppuccin-mocha-mauve.toml` theme from catppuccin/television repo and create `dot_config/television/themes/catppuccin-mocha-mauve.toml`
- [x] 2.2 Create `dot_config/television/config.toml` with theme, shell integration keybindings (disable Ctrl+R), channel triggers, and UI preferences
- [x] 2.3 Create `dot_config/television/cable/rg-edit.toml` custom channel (rg source → bat preview → editor action)

## 3. Shell integration

- [x] 3.1 Add `eval "$(tv init zsh)"` to `dot_zshrc.tmpl` after fzf init block and before atuin init, with explanatory comment
- [x] 3.2 Remove `fkill()` function from `dot_zshrc.tmpl`
- [x] 3.3 Remove `frg()` function from `dot_zshrc.tmpl`
- [x] 3.4 Remove `fglog()` function from `dot_zshrc.tmpl`
- [x] 3.5 Remove `fgco()` function from `dot_zshrc.tmpl`
- [x] 3.6 Remove `# fzf power functions` and `# Git + fzf integration` section headers from `dot_zshrc.tmpl`

## 4. Verification

- [x] 4.1 Run `chezmoi apply --dry-run` to verify template renders correctly
- [x] 4.2 Verify `tv` launches with catppuccin-mocha-mauve theme
- [ ] 4.3 Verify Ctrl+T triggers tv smart autocomplete (not fzf file search)
- [ ] 4.4 Verify Ctrl+R triggers atuin (not tv shell history)
- [ ] 4.5 Verify Alt+C triggers fzf directory jump (unchanged)
- [ ] 4.6 Verify `tv rg-edit` channel works (search → preview → open in editor)
- [ ] 4.7 Verify `tv git-branch` Enter action does checkout
- [ ] 4.8 Verify `tv procs` Ctrl+K action kills a process
