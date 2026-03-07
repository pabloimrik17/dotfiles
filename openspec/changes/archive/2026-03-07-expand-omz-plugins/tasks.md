## 1. nvm plugin migration

- [x] 1.1 Move `export NVM_DIR="$HOME/.nvm"` from line 30 to before `source $ZSH/oh-my-zsh.sh`
- [x] 1.2 Add `zstyle ':omz:plugins:nvm' lazy yes` before `source $ZSH/oh-my-zsh.sh`
- [x] 1.3 Add `zstyle ':omz:plugins:nvm' autoload yes` before `source $ZSH/oh-my-zsh.sh`
- [x] 1.4 Add `zstyle ':omz:plugins:nvm' silent-autoload yes` before `source $ZSH/oh-my-zsh.sh`
- [x] 1.5 Remove line 31 (`[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"`)
- [x] 1.6 Remove line 32 (`[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"`)

## 2. gh plugin migration

- [x] 2.1 Remove line 75 (`# GitHub CLI completions` comment)
- [x] 2.2 Remove line 76 (`eval "$(gh completion -s zsh)"`)

## 3. bun plugin migration

- [x] 3.1 Remove line 134 (`# bun completions` comment)
- [x] 3.2 Remove line 135 (`[ -s "{{ .chezmoi.homeDir }}/.bun/_bun" ] && source ...`)
- [x] 3.3 Verify lines 138-139 (`BUN_INSTALL` and `PATH`) remain intact

## 4. Expand plugin array

- [x] 4.1 Replace the current `plugins=()` block (lines 16-22) with the categorized 26-plugin array from design decision D4
- [x] 4.2 Verify all 26 plugins are present: `git`, `gitignore`, `brew`, `docker`, `docker-compose`, `npm`, `macos`, `gh`, `aliases`, `colored-man-pages`, `command-not-found`, `copybuffer`, `copyfile`, `copypath`, `encode64`, `extract`, `fancy-ctrl-z`, `history`, `jsontools`, `safe-paste`, `sudo`, `bgnotify`, `urltools`, `web-search`, `you-should-use`, `nvm`, `bun`
- [x] 4.3 Verify excluded plugins are NOT present: `eza`, `fzf`, `zoxide`, `starship`, `z`

## 5. Validation

- [x] 5.1 Verify all custom alias blocks are unchanged (eza, bat, zoxide, git, gh shortcuts, ripgrep, utility)
- [x] 5.2 Verify tool init lines are unchanged (starship, zoxide, atuin, fzf, autosuggestions, syntax-highlighting)
- [x] 5.3 Verify PATH/env exports are unchanged (PNPM_HOME, BUN_INSTALL)
- [x] 5.4 Verify no orphaned comments remain from removed lines
