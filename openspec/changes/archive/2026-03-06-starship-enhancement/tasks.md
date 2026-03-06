## 1. Catppuccin Palette and Top-Level Config

- [x] 1.1 Add `palette = 'catppuccin_mocha'` to the top of `dot_config/starship.toml`
- [x] 1.2 Add `[palettes.catppuccin_mocha]` section at the bottom of the file with all 26 catppuccin-mocha hex values (rosewater through crust)

## 2. Module Behavioral Config

- [x] 2.1 Extend `[directory]` section with `truncate_to_repo = true`, `truncation_symbol = "…/"`, `home_symbol = "~"`, and `style = "bold sapphire"` (preserving existing `read_only` from preset)
- [x] 2.2 Extend `[git_branch]` section with `style = "bold mauve"` (preserving existing `symbol` from preset)
- [x] 2.3 Add `[git_status]` section with format string, count-aware ahead/behind, stash indicator, and custom symbols (modified=●, deleted=✘, renamed=», stashed=≡)
- [x] 2.4 Add `[character]` section with success_symbol, error_symbol, and vimcmd_symbol
- [x] 2.5 Add `[cmd_duration]` section with min_time=2000, style=yellow, show_milliseconds=false

## 3. Disable Unused Modules

- [x] 3.1 Add `disabled = true` to existing `[hg_branch]` and `[fossil_branch]` sections (add sections if not present from preset)
- [x] 3.2 Add `[pijul_channel]`, `[conda]`, `[guix_shell]`, `[nix_shell]` sections with `disabled = true`

## 4. BAT_THEME Export

- [x] 4.1 Add `export BAT_THEME="Catppuccin Mocha"` to `dot_zshrc.tmpl` in the environment/tool config section

## 5. Verification

- [x] 5.1 Verify all Nerd Font preset symbol entries are preserved (no existing `symbol` lines removed or altered)
- [x] 5.2 Verify Starship v1.11+ is installed (`starship --version`) — required for `palette` and `[palettes.*]` support
- [x] 5.3 Verify `Catppuccin Mocha` theme is available in bat (`bat --list-themes | grep "Catppuccin Mocha"`)
- [x] 5.4 Run `chezmoi diff` to confirm only expected files are modified
