## 1. Install Script

- [ ] 1.1 Add `zsh-completions` to the brew install loop in `run_once_install-packages.sh.tmpl` (Group 3, alongside `zsh-autosuggestions` and `zsh-syntax-highlighting`)
- [ ] 1.2 Add `zsh-completions` to the non-macOS manual install instructions

## 2. ZSH Configuration

- [ ] 2.1 Add FPATH append block in `dot_zshrc.tmpl` between `plugins=()` array and `source $ZSH/oh-my-zsh.sh`, using chezmoi OS/arch conditionals (darwin/arm64, darwin/x86_64, linux)

## 3. Verification

- [ ] 3.1 Run `chezmoi diff` to confirm rendered output is correct for the current platform
- [ ] 3.2 Open a new shell and verify `echo $FPATH` includes the zsh-completions path
- [ ] 3.3 Verify tab-completion works for a previously uncovered command (e.g., `fd --<TAB>`)
