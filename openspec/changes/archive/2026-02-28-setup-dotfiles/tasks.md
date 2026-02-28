## 1. chezmoi Foundation

- [x] 1.1 Create `.chezmoi.toml.tmpl` with `promptStringOnce` for name and email variables
- [x] 1.2 Create `.chezmoiignore.tmpl` with OS-conditional rules (exclude macOS-only files on non-darwin)

## 2. Ghostty Config

- [x] 2.1 Add `dot_config/ghostty/config` with current Ghostty configuration (theme, font, window, cursor, shell integration, keybindings)
- [x] 2.2 Add `dot_config/ghostty/themes/` with all 4 catppuccin variants (frappe, latte, macchiato, mocha)

## 3. Zsh Config

- [x] 3.1 Create `dot_zshrc.tmpl` — convert current `.zshrc` to template, replacing hardcoded home paths with `{{ .chezmoi.homeDir }}` and brew prefix paths with arch-conditional (`arm64` → `/opt/homebrew/share/`, else → `/usr/local/share/`)
- [x] 3.2 Add `dot_config/starship.toml` with current Starship prompt configuration

## 4. Claude Code Config

- [x] 4.1 Create `dot_claude/settings.json.tmpl` — convert `settings.json` to template, replacing hardcoded home paths with `{{ .chezmoi.homeDir }}`
- [x] 4.2 Verify `settings.local.json` is NOT included in source state (machine-local override)

## 5. Dependency Bootstrap

- [x] 5.1 Create `run_once_install-packages.sh.tmpl` with OS-conditional logic (`darwin` → brew, else → print manual instructions)
- [x] 5.2 Add brew packages group with interactive prompt: starship, eza, bat, zoxide, atuin, fzf, ripgrep, lazygit
- [x] 5.3 Add font group with interactive prompt: `brew install --cask font-hack-nerd-font`
- [x] 5.4 Add oh-my-zsh group: install oh-my-zsh (if absent, `--unattended`), clone you-should-use plugin (if absent), install zsh-autosuggestions and zsh-syntax-highlighting via brew
- [x] 5.5 Add idempotent guards (`command -v <tool>` checks) and graceful failure (continue on individual package failure)

## 6. Validation

- [x] 6.1 Run `chezmoi diff` on current machine to verify source state matches existing config
- [x] 6.2 Run `chezmoi doctor` to validate source state integrity
- [x] 6.3 Test `chezmoi apply --dry-run` to verify no destructive changes
