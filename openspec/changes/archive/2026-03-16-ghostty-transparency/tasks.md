## 1. Add transparency settings

- [x] 1.1 Add `# Transparency` section to `dot_config/ghostty/config` after `# Theme` (after `minimum-contrast = 1.1`) and before `# Font`
- [x] 1.2 Add `background-opacity = 0.96` and `background-blur = 12` as active settings
- [x] 1.3 Add commented-out alternative presets with descriptions:
    - `0.90 / 10` — ambient tint, more transparent
    - `0.94 / 12` — subtle, original other-machine config
    - `0.97 / 16` — barely perceptible, high blur

## 2. Verify

- [x] 2.1 Confirm section ordering: Theme → Transparency → Font
- [x] 2.2 Run `chezmoi diff` to verify the change applies cleanly
