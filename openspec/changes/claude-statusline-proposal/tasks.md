## 1. Update claude-hud config

- [ ] 1.1 Set `gitStatus.showAheadBehind` to `true` in `~/.claude/plugins/claude-hud/config.json`
- [ ] 1.2 Set `gitStatus.showFileStats` to `true`
- [ ] 1.3 Set `display.usageThreshold` to `60`
- [ ] 1.4 Add `display.sevenDayThreshold` with value `70`

## 2. Verify

- [ ] 2.1 Confirm statusline renders git ahead/behind and file stats
- [ ] 2.2 Confirm usage appears when 5h or 7d exceeds 60%, and 7d detail appears at 70%+
