## Why

The current `dot_config/starship.toml` is a verbatim copy of the Nerd Font Symbols Preset — it only overrides icon symbols for ~40 modules. No formatting, colors, behavioral tuning, or palette integration. Starship falls back to built-in defaults for everything else, which means: no repo-aware directory paths, no commit count in ahead/behind indicators, no stash visibility, and colors that only accidentally match catppuccin-mocha through Ghostty's ANSI mapping rather than intentionally.

## What Changes

- Add catppuccin-mocha palette definition to `starship.toml` with selective style overrides on `directory`, `git_branch`, and `git_status` modules (3-4 modules, not all)
- Add `[directory]` truncation config with `truncate_to_repo = true` for repo-relative paths
- Add `[git_status]` with count-aware ahead/behind (`⇡${count}`/`⇣${count}`), stash indicator, and cleaner modified symbol
- Add explicit `[character]` success/error/vimcmd symbols
- Add explicit `[cmd_duration]` config
- Disable unused VCS/cloud modules (`hg_branch`, `fossil_branch`, `pijul_channel`, `conda`, `guix_shell`, `nix_shell`) — keep language modules with auto-detect
- Add `export BAT_THEME="Catppuccin Mocha"` to `dot_zshrc.tmpl` for consistent theming across bat and delta

## Capabilities

### New Capabilities

- `starship-config`: Starship prompt configuration including catppuccin-mocha palette integration, directory behavior, git status symbols, character module, command duration, and module enable/disable policy
- `bat-theme`: BAT_THEME environment variable setting for consistent catppuccin theming across bat and delta (syntax highlighting)

### Modified Capabilities

_None — no existing specs are affected._

## Impact

- **Modified files**: `dot_config/starship.toml` (palette + module configs), `dot_zshrc.tmpl` (BAT_THEME export)
- **Theme coupling**: Starship palette creates a soft dependency on catppuccin-mocha — switching themes requires editing the palette name (single line) or adding a new `[palettes.x]` block
- **BAT_THEME propagation**: Setting BAT_THEME automatically themes both `bat` and `delta` (delta inherits bat's syntax engine) — no gitconfig changes needed
- **No breaking changes**: All additions are new config; existing Nerd Font symbol overrides are preserved
