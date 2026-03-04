## 1. Add plugin entry

- [x] 1.1 Add `"plannotator@plannotator": true` to `enabledPlugins` in `dot_claude/settings.json.tmpl`

## 2. Add CLI installation to install script

- [x] 2.1 Add Group 5 ("Claude Code plugin dependencies") to `run_once_install-packages.sh.tmpl`
- [x] 2.2 Add idempotency check (`command -v plannotator`) to skip if already installed
- [x] 2.3 Add plannotator to non-macOS manual instructions

## 3. Verify deployment

- [x] 3.1 Run `chezmoi diff` to confirm the change targets `~/.claude/settings.json`
- [x] 3.2 Run `chezmoi apply` and verify `plannotator@plannotator` appears in the deployed file
