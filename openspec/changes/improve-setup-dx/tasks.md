## 1. Grouped macOS Defaults with Descriptive Previews

- [x] 1.1 Refactor `run_once_configure-macos-defaults.sh.tmpl` to wrap each section (Finder, Dock, Trackpad, Keyboard, Hot corners, Misc) in its own `confirm()` block
- [x] 1.2 Add bulleted descriptive preview before each group's confirm prompt (human-readable description per setting)
- [x] 1.3 Scope `killall Finder` and `killall Dock` to only run when their respective group was accepted (track acceptance with flags)
- [x] 1.4 Verify that declining all groups produces zero `defaults write` calls and zero service restarts

## 2. Cask Metadata Restructure

- [x] 2.1 Replace separate `CASK_PACKAGES`, `OPTIONAL_CASK_PACKAGES` arrays with a single structured list containing cask name, category, and description per entry
- [x] 2.2 Define category and description for all 30 casks (19 core + 11 optional)
- [x] 2.3 Update `install_cask()` to work with the new data structure

## 3. Pre-scan and Adaptive Cask Picker

- [x] 3.1 Implement pre-scan loop: check `/Applications/<AppName>.app` for every cask entry, build list of pending (uninstalled) casks
- [x] 3.2 Implement silent skip when 0 casks pending (print summary line, no prompt)
- [x] 3.3 Implement direct `confirm()` per app when 1-3 casks pending (include description in prompt)
- [x] 3.4 Implement fzf multi-select picker when 4+ casks pending: format lines as `[Category] cask-name  description`, all deselected, header with keybinding hints
- [x] 3.5 Parse fzf output to extract selected cask names and install only those
- [x] 3.6 Implement fallback when fzf unavailable: print full list with descriptions, single confirm for all

## 4. MAS Apps Idempotency and Adaptive Prompts

- [x] 4.1 Add `mas list` pre-scan to detect already-installed App Store apps
- [x] 4.2 Apply same adaptive threshold (0=skip, 1-3=direct prompt with description, 4+=fzf) to MAS apps group
- [x] 4.3 Add descriptions to MAS app entries (e.g., "AI search assistant", "Recipe manager")

## 5. Claude Code Idempotency Checks

- [x] 5.1 Add `claude plugin marketplace list --json` pre-scan and `marketplace_installed()` helper function
- [x] 5.2 Add `claude plugin list --json` pre-scan and `plugin_installed()` helper function
- [x] 5.3 Wrap each `claude plugin marketplace add` call with `marketplace_installed` skip check
- [x] 5.4 Wrap each `claude plugin install` call with `plugin_installed` skip check
- [x] 5.5 Add silent group skip when all marketplaces and plugins are already present (print summary, no prompt)

## 6. Installed Summary for All Groups

- [x] 6.1 Add pre-scan skip logic to brew formulae group (all installed → skip prompt)
- [x] 6.2 Add pre-scan skip logic to fonts group (all installed → skip prompt)
- [x] 6.3 Add pre-scan skip logic to oh-my-zsh group (all installed → skip prompt)
- [x] 6.4 Add pre-scan skip logic to NVM/Node/corepack group (all installed → skip prompt)
- [x] 6.5 Verify full noop run produces zero prompts and only summary lines
