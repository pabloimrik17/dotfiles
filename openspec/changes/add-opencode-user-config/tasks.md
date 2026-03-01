## 1. Create config files

- [ ] 1.1 Create `dot_config/opencode/opencode.jsonc` with `$schema` and `model` setting
- [ ] 1.2 Create `dot_config/opencode/tui.json` with `$schema` and `theme` setting

## 2. Verify deployment

- [ ] 2.1 Run `chezmoi diff` to confirm both files target `~/.config/opencode/`
- [ ] 2.2 Run `chezmoi apply` and verify files are created at `~/.config/opencode/opencode.jsonc` and `~/.config/opencode/tui.json`
- [ ] 2.3 Confirm existing `~/.config/opencode/package.json` is not affected
