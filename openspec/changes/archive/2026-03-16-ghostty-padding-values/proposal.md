## Why

The repo currently sets `window-padding-x = 10` and `window-padding-y = 10`, but the actual machine config has diverged to `8x4`. This inconsistency needs resolving as part of unifying the setup across two machines. After hands-on A/B testing, `10x6` was selected as the best compromise: generous lateral breathing room without sacrificing vertical lines in dense output sessions (Claude Code) or the 40%-height quick terminal.

## What Changes

- Change `window-padding-y` from `10` to `6` in `dot_config/ghostty/config`
- Keep `window-padding-x = 10` (no change)
- Keep `window-padding-balance = true` (no change)

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `ghostty-visual-polish`: Adding a requirement that documents the chosen padding values (x=10, y=6) and the rationale behind them

## Impact

- `dot_config/ghostty/config`: single-line change (`window-padding-y`)
- `openspec/specs/ghostty-visual-polish/spec.md`: new requirement documenting padding value decision
