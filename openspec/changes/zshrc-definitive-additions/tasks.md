## 1. Install script dependencies

- [ ] 1.1 Add `fd` and `direnv` to `BREW_PACKAGES` array in `run_once_install-packages.sh.tmpl`

## 2. Navigation aliases

- [ ] 2.1 Add `..`, `...`, `....` aliases in a new "Navigation" subsection in `dot_zshrc.tmpl`

## 3. eza developer views

- [ ] 3.1 Add `lla`, `ldev`, `lcode`, `lsize` aliases in a new "eza developer views" subsection in `dot_zshrc.tmpl`

## 4. Package manager aliases

- [ ] 4.1 Add pnpm aliases (`pi`, `pd`, `pb`, `pt`, `pa`, `pr`, `px`) in a new "pnpm shortcuts" subsection
- [ ] 4.2 Add bun aliases (`bi`, `bd`, `bb`, `bt`, `ba`, `br`, `bx`) in a new "bun shortcuts" subsection

## 5. jq aliases

- [ ] 5.1 Add `jqless`, `pretty-json`, `check-json` aliases in a new "jq helpers" subsection

## 6. fzf power functions

- [ ] 6.1 Add `fkill` function (interactive process killer via fzf)
- [ ] 6.2 Add `frg` function (ripgrep + fzf + bat preview → open in editor)

## 7. Git + fzf integration functions

- [ ] 7.1 Add `fglog` function (browse git log with fzf diff preview)
- [ ] 7.2 Add `fgco` function (checkout branch with fzf commit preview)

## 8. Tool environment configuration

- [ ] 8.1 Add `export BAT_THEME="Catppuccin Mocha"` 
- [ ] 8.2 Add conditional direnv hook (`command -v direnv &>/dev/null && eval "$(direnv hook zsh)"`)
