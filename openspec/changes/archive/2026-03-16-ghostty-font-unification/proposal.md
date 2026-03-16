## Why

Two machines run different Ghostty font configurations (Hack Nerd Font @ 14 vs JetBrainsMono Nerd Font @ 15). The dotfiles repo should define a single font config that works well across both machines. After hands-on evaluation of all 8 combinations (2 fonts x 2 sizes x thicken on/off), the winner is clear — but the runner-up should be available as a commented alternative for quick switching.

Additionally, the chosen font may not be pre-installed (e.g., it comes bundled with JetBrains IDEs but not with macOS itself), so the setup script needs to ensure the font is available.

## What Changes

- Unify Ghostty font config to **Hack Nerd Font @ 14, font-thicken ON** (confirmed winner from evaluation)
- Add commented alternative config for **JetBrainsMono Nerd Font @ 14, thicken ON** (runner-up) for fast switching
- Verify font installation requirements and update setup script if needed to install both fonts
- Update `ghostty-visual-polish` spec to reflect the unified decision and alternative

## Capabilities

### New Capabilities

_None_

### Modified Capabilities

- `ghostty-visual-polish`: Font specification changes from a single hardcoded choice to a primary + commented alternative pattern. Setup requirements may expand to include font installation.

## Impact

- `dot_config/ghostty/config` — font section updated with alternative
- `ghostty-visual-polish` spec — updated to reflect decision
- Setup script — may need font installation step (depends on investigation of whether fonts need manual install or come from tooling like JetBrains/Homebrew)
