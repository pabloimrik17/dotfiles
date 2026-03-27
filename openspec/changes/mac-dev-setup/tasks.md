## 1. macOS Defaults Script

- [x] 1.1 Create `run_once_configure-macos-defaults.sh.tmpl` with chezmoi macOS template guard
- [x] 1.2 Add shared helper functions (info, warn, error) or source from common location
- [x] 1.3 Implement Finder defaults (AppleShowAllFiles, ShowPathbar, ShowStatusBar, FXRemoveOldTrashItems, \_FXSortFoldersFirst, FXEnableExtensionChangeWarning, NewWindowTarget/Path, AppleShowAllExtensions, chflags nohidden ~/Library)
- [x] 1.4 Implement Dock defaults (autohide, show-recents, tilesize 62)
- [x] 1.5 Implement Trackpad defaults (Clicking true)
- [x] 1.6 Implement Keyboard defaults (disable auto-capitalize, smart dashes, smart quotes, period substitution; KeyRepeat 2, InitialKeyRepeat 15)
- [x] 1.7 Implement Hot corners (all four corners to 0)
- [x] 1.8 Implement Misc defaults (Preview ApplePersistenceIgnoreState, Siri StatusMenuVisible false)
- [x] 1.9 Add killall Finder and killall Dock with error suppression
- [x] 1.10 Add logout advisory message at end of script

## 2. Expand BREW_PACKAGES

- [x] 2.1 Add `fd`, `gh`, `git-delta`, `git`, `tmux`, `uv`, `mas`, `wget`, `opencode` to BREW_PACKAGES array
- [x] 2.2 Update `pkg_bin()` function with `git-delta` -> `delta` mapping
- [x] 2.3 Implement brew-specific check for `git` package (use `brew list git` instead of `command -v git`)
- [x] 2.4 Update non-macOS fallback instructions to include all 17 packages

## 3. Brew Cask Installation Group

- [x] 3.1 Define `CASK_PACKAGES` array with 19 core casks
- [x] 3.2 Define `OPTIONAL_CASK_PACKAGES` array with 11 optional casks
- [x] 3.3 Implement `cask_to_app()` function with hardcoded mappings and default derivation
- [x] 3.4 Implement core cask installation loop with `/Applications/*.app` existence check and single confirm
- [x] 3.5 Implement optional cask installation loop with individual confirm per cask
- [x] 3.6 Add error accumulation for failed cask installs (non-fatal)

## 4. Mac App Store Installation Group

- [x] 4.1 Define MAS_APPS list with app IDs and names (Perplexity 6714467650, Mela 1568924476)
- [x] 4.2 Implement App Store login check via `mas account`
- [x] 4.3 Implement `mas install` loop with confirmation prompt
- [x] 4.4 Add manual install instructions block at end of script (Last.fm, CleanMyMac, Adobe CC, 1Password Safari)

## 5. NVM + Node + Corepack Group

- [x] 5.1 Implement NVM installation via curl script with `PROFILE=/dev/null` to prevent shell config modification
- [x] 5.2 Implement `$HOME/.nvm` existence check for idempotency
- [x] 5.3 Source `$NVM_DIR/nvm.sh` after install and run `nvm install --lts` + `nvm alias default lts/*`
- [x] 5.4 Implement Node existence check (`command -v node`) to skip if already installed
- [x] 5.5 Run `corepack enable` after Node is available
- [x] 5.6 Add graceful failure handling (skip Node/corepack if NVM install fails)

## 6. Script Structure and Group Ordering

- [x] 6.1 Renumber existing groups (OpenCode plugins -> Group 7, Claude Code plugins -> Group 8)
- [x] 6.2 Insert new groups in correct order: Casks (Group 4), MAS (Group 5), NVM/Node (Group 6)
- [x] 6.3 Add manual install instructions section as Group 9 (always printed, no confirm)
- [x] 6.4 Verify the complete group sequence runs end-to-end without errors on current Mac
