## 1. Add plugin entry

- [x] 1.1 Add `"plannotator@plannotator": true` to `enabledPlugins` in `dot_claude/settings.json.tmpl`

## 2. Verify deployment

- [x] 2.1 Run `chezmoi diff` to confirm the change targets `~/.claude/settings.json`
- [x] 2.2 Run `chezmoi apply` and verify `plannotator@plannotator` appears in the deployed file
