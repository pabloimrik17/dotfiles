## 1. Template Fix

- [x] 1.1 Add `COLUMNS=200` prefix to the `statusLine.command` in `dot_claude/settings.json.tmpl`

## 2. Verification

- [x] 2.1 Run `chezmoi cat ~/.claude/settings.json` and confirm `COLUMNS=200` appears in the statusline command
- [x] 2.2 Run `chezmoi diff` to verify only the expected change in `settings.json`
