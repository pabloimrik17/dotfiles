## Why

The Ghostty config has no transparency settings. Adding subtle background opacity with blur gives a sense of depth — the wallpaper tints through slightly without affecting readability. Values were explored live on the current machine, testing multiple presets against a desktop with icons and folders as background.

## What Changes

- Add `background-opacity = 0.96` and `background-blur = 12` to the Ghostty config under a `# Transparency` section
- Include commented-out alternative presets with explanations so future adjustments are easy without re-exploring

## Capabilities

### New Capabilities

- `ghostty-transparency`: Background opacity and blur settings for Ghostty, including chosen values and documented alternative presets

### Modified Capabilities

None — transparency is additive and doesn't change existing visual polish requirements.

## Impact

- File: `dot_config/ghostty/config`
- macOS only: `background-blur` is a compositor feature; on non-macOS it is silently ignored
- `minimum-contrast = 1.1` (already configured) ensures text stays readable at any opacity
