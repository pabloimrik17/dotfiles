## 1. Implementation

- [x] 1.1 Add PATH pre-seed block in `dot_zshrc.tmpl` after `source $ZSH/oh-my-zsh.sh` that discovers the latest nvm node version and prepends its `bin/` to PATH
- [x] 1.2 Ensure the block guards with `[ -d "$NVM_DIR/versions/node" ]` and cleans up temp variables with `unset`

## 2. Verification

- [x] 2.1 Run `chezmoi diff` to confirm only the expected lines are added
- [x] 2.2 Apply with `chezmoi apply` and verify `node` is in PATH via `/usr/bin/env node --version`
- [x] 2.3 Verify lazy loading still works: open new shell, confirm `nvm` is not fully loaded until first `node` invocation
