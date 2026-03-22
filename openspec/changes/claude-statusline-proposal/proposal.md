## Why

The current claude-hud statusline config hides useful information behind overly conservative thresholds. Git ahead/behind and file stats are disabled, preventing at-a-glance awareness of push/pull needs and working tree state. Weekly (7d) usage only appears at 80%, and the 5h usage gate is also set to 80% — meaning rate limit awareness comes too late to adjust behavior.

## What Changes

- Enable `gitStatus.showAheadBehind` — show commits ahead/behind remote
- Enable `gitStatus.showFileStats` — show modified/added/deleted/untracked file counts
- Lower `display.usageThreshold` from 80 to 60 — show 5h usage earlier
- Add `display.sevenDayThreshold: 70` — show 7d usage when it reaches 70% (was defaulting to 80)

## Capabilities

### New Capabilities

- `claude-hud-config`: Desired claude-hud plugin configuration values

### Modified Capabilities

None.

## Impact

- `~/.claude/plugins/claude-hud/config.json` — 4 config values changed
- Statusline will show more git detail and surface usage warnings earlier
- No code changes, no dependency changes
- Config is plugin-managed (not chezmoi-managed), applied directly
