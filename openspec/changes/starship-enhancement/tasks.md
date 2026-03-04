## 1. Catppuccin Palette and Top-Level Config

- [ ] 1.1 Add `palette = 'catppuccin_mocha'` to the top of `dot_config/starship.toml`
- [ ] 1.2 Add `[palettes.catppuccin_mocha]` section at the bottom of the file with all 26 catppuccin-mocha hex values (rosewater through crust)

## 2. Module Behavioral Config

- [ ] 2.1 Extend `[directory]` section with `truncate_to_repo = true`, `truncation_symbol = "…/"`, `home_symbol = "~"`, and `style = "bold sapphire"` (preserving existing `read_only` from preset)
- [ ] 2.2 Extend `[git_branch]` section with `style = "bold mauve"` (preserving existing `symbol` from preset)
- [ ] 2.3 Add `[git_status]` section with format string, count-aware ahead/behind, stash indicator, and custom symbols (modified=●, deleted=✘, renamed=», stashed=≡)
- [ ] 2.4 Add `[character]` section with success_symbol, error_symbol, and vimcmd_symbol
- [ ] 2.5 Add `[cmd_duration]` section with min_time=2000, style=yellow, show_milliseconds=false

## 3. Disable Unused Modules

- [ ] 3.1 Add `disabled = true` to existing `[hg_branch]` and `[fossil_branch]` sections (add sections if not present from preset)
- [ ] 3.2 Add `[pijul_channel]`, `[conda]`, `[guix_shell]`, `[nix_shell]` sections with `disabled = true`

## 4. BAT_THEME Export

- [ ] 4.1 Add `export BAT_THEME="Catppuccin Mocha"` to `dot_zshrc.tmpl` in the environment/tool config section

## 5. Verification

- [ ] 5.1 Verify all Nerd Font preset symbol entries are preserved (no existing `symbol` lines removed or altered)
- [ ] 5.2 Run `chezmoi diff` to confirm only expected files are modified
