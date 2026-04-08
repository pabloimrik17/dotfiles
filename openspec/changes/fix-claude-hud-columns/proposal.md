## Why

The claude-hud statusline plugin wraps to multiple rows when `COLUMNS` is not set, because `process.stdout.columns` is unavailable in subprocess mode and the fallback is only 40 characters. The workaround (`COLUMNS=200` in the statusline command) must be applied in `~/.claude/settings.json`, but `chezmoi apply` overwrites it from `dot_claude/settings.json.tmpl` which lacks the fix. This forces manual re-application after every `chezmoi apply`.

## What Changes

- Add `COLUMNS=200` to the statusline command in `dot_claude/settings.json.tmpl` so chezmoi preserves the workaround across applies
- This is a temporary fix until the upstream issue (jarrodwatts/claude-hud#404) resolves the 40-char fallback

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `claude-hud-config`: Add requirement that the statusline command sets `COLUMNS=200` to prevent line wrapping in subprocess mode

## Impact

- **File**: `dot_claude/settings.json.tmpl` — the `statusLine.command` value changes to include `COLUMNS=200`
- **Effect**: All machines managed by chezmoi will get the fix on next `chezmoi apply`
- **Upstream**: Temporary until jarrodwatts/claude-hud#404 is resolved; the `COLUMNS=200` prefix can be removed once the plugin handles missing terminal width gracefully
