## Why

The setup scripts (`run_onchange_install-packages.sh.tmpl` and `run_once_configure-macos-defaults.sh.tmpl`) lack visibility into what they will install or configure. Core GUI casks prompt "Install core GUI apps (19 apps)?" without listing them. macOS defaults apply 22 settings with zero confirmation. On re-runs, groups that are fully installed still prompt for confirmation. This makes the experience opaque, all-or-nothing, and noisy on repeated executions.

## What Changes

- **macOS defaults**: Add grouped confirmation prompts (Finder, Dock, Trackpad, Keyboard, Hot corners, Misc) with descriptive preview of each setting before asking [Y/n]
- **GUI cask installation**: Replace the current core/optional split (single confirm + 11 individual confirms) with an fzf multi-select picker. All apps deselected by default, with `[Category]` prefixes and one-line descriptions. Adaptive behavior: 0 pending = silent skip, 1-3 pending = direct prompt per app, 4+ pending = fzf picker
- **Idempotency gaps**: Add pre-install checks for MAS apps (`mas list`), Claude Code marketplaces (`claude plugin marketplace list --json`), and Claude Code plugins (`claude plugin list --json`). Groups where everything is already installed skip silently without prompting.
- **MAS apps**: Apply the same adaptive prompt pattern as casks (0=skip, 1-3=direct, 4+=fzf) for future scalability, though currently 2 apps fall into direct prompt range

## Capabilities

### New Capabilities

- `fzf-cask-picker`: fzf-based multi-select picker for GUI app (cask) installation with category prefixes, descriptions, adaptive thresholds, and installed-app exclusion
- `grouped-defaults-confirm`: Grouped confirmation prompts for macOS defaults with descriptive previews per setting group (Finder, Dock, Trackpad, Keyboard, Hot corners, Misc)

### Modified Capabilities

- `claude-code-plugins`: Add idempotency checks for marketplace registration and plugin installation using `--json` CLI queries
- `skills-global-install`: No requirement changes (already has idempotency checks)

## Impact

- **Files modified**: `run_once_configure-macos-defaults.sh.tmpl` (add grouped confirm with previews), `run_onchange_install-packages.sh.tmpl` (fzf picker for casks, idempotency checks for MAS/CC marketplaces/CC plugins, adaptive prompt logic)
- **Dependencies**: `fzf` (already installed in Group 1 brew formulae, available by Group 4 casks)
- **Ordering**: fzf must be installed before Group 4 runs. Current group ordering already satisfies this (Group 1 installs fzf, Group 4 uses it)
- **Backward compatibility**: If fzf is unavailable (e.g., Group 1 was skipped), cask installation falls back to listing all pending casks (with descriptions) and a single confirm prompt for all
- **Cross-references**: The `mac-dev-setup` change introduced the current cask/defaults/MAS structure. This change refines its UX without changing what gets installed.
