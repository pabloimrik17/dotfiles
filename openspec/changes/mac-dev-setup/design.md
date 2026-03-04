## Context

The dotfiles repo uses chezmoi to manage configuration files and `run_once_` scripts for one-time setup. The current install script (`run_once_install-packages.sh.tmpl`) has 5 groups covering brew formulae, fonts, Oh My Zsh, and AI tool plugins. It uses interactive confirmation per group and idempotent checks (`command -v`, directory existence, `brew list`).

Several CLI tools in active use (`fd`, `gh`, `git-delta`, etc.) are missing from the script. GUI apps, macOS defaults, Node.js environment, and App Store apps have zero automation. All of these were manually configured on the current machine and would need to be repeated on a new one.

## Goals / Non-Goals

**Goals:**

- Automate macOS system settings so a fresh Mac gets the same Finder/Dock/keyboard/trackpad settings with no manual work
- Ensure all actively used brew formulae are in the install script (no silent dependencies on manually installed tools)
- Automate GUI app installation via brew cask, with conflict-safe checks against existing manual installs
- Automate Node.js environment setup (nvm + LTS + corepack) as a single group
- Automate Mac App Store app installation via `mas` CLI
- Print clear instructions for apps that can't be automated (license-gated, special installers)
- Maintain the existing patterns: interactive confirmation, idempotent checks, error accumulation, non-macOS fallback

**Non-Goals:**

- Managing VS Code settings/extensions (intentionally unmanaged -- secondary editor)
- SSH key generation (not frequently needed)
- Managing `~/.gitconfig` (covered by separate `git-dotfile-proposal` change)
- Modifying `.zshrc` (covered by other proposals: `expand-omz-plugins`, `zshrc-definitive-additions`)
- Installing apps that require license activation during install (Adobe CC, CleanMyMac)
- Dark mode automation (`defaults write` for appearance is unreliable; better set via System Settings)

## Decisions

### D1: Separate script for macOS defaults vs embedding in install script

**Decision**: Create a new `run_once_configure-macos-defaults.sh.tmpl` as a separate file.

**Rationale**: macOS system settings are conceptually different from package installation. They configure the OS, not install tools. Separating them means:
- The defaults script can run independently and be re-triggered separately (chezmoi `run_once_` keyed by content hash)
- Failure in defaults doesn't affect package installation
- Easier to review and modify the settings list

**Alternatives considered**: Embedding as Group 0 in the install script. Rejected because it mixes concerns and makes the already-large install script harder to navigate.

### D2: Cask conflict detection via `/Applications/*.app` check

**Decision**: Before each `brew install --cask`, check if `/Applications/<AppName>.app` exists. If it does, skip the install regardless of how it was installed.

**Rationale**: Brew casks error out if an app already exists in `/Applications/`. The user has 27+ apps installed manually (none via brew currently). A cask-to-app-name mapping function (`cask_to_app()`) handles cases where the cask name doesn't match the `.app` name (e.g., `visual-studio-code` -> `Visual Studio Code`, `zoom` -> `zoom.us`, `1password` -> `1Password`).

**Alternatives considered**:
- `brew list --cask` check: Only detects brew-managed installs, would miss manual ones
- `brew install --cask --force`: Overwrites existing installs, risky
- Skip cask group entirely on non-fresh machines: Loses the value of automating new installs

### D3: Core casks (single confirm) + optional casks (individual confirm)

**Decision**: Split casks into two tiers:
- **Core** (19 apps): Single `confirm()` prompt installs all. These are apps the user always wants.
- **Optional** (11 apps): Each gets its own `confirm()` prompt. These vary by machine or use case.

**Rationale**: Installing 30 apps with individual prompts is tedious. But some apps (Telegram, WhatsApp, Teams, Stremio, AppCleaner, Spark, VNC Viewer, Raspberry Pi Imager, Transmission Remote GUI, Folx, Philips Hue Sync) aren't always needed. Grouping keeps the common case fast while preserving choice.

### D4: NVM via curl installer, not brew

**Decision**: Install NVM using its official curl script, not `brew install nvm`.

**Rationale**: The NVM project explicitly states: "Homebrew installation is not supported." Brew's own caveats confirm: "upstream has asked us to make explicit managing nvm via Homebrew is unsupported." The curl installer writes to `$HOME/.nvm` which matches the existing `.zshrc` configuration (`export NVM_DIR="$HOME/.nvm"`). No `.zshrc` changes needed.

**Alternatives considered**: `brew install nvm` -- rejected due to upstream non-support and different install paths that would require `.zshrc` modifications.

### D5: pnpm via corepack, not brew

**Decision**: Enable pnpm through Node.js's built-in `corepack enable` command, not `brew install pnpm`.

**Rationale**: Corepack ships with Node >= 16.10 and manages pnpm/yarn versions per-project. It avoids version conflicts between a globally brew-installed pnpm and project-level requirements. The existing `PNPM_HOME` in `.zshrc` is compatible with corepack-managed pnpm.

### D6: `mas` for App Store apps

**Decision**: Install `mas` (Mac App Store CLI) as a brew formula, then use `mas install <id>` for App Store apps.

**Rationale**: Two apps (Perplexity, Mela) are App Store-only with no brew cask. `mas` is the standard CLI tool for this. It requires the user to be signed into the App Store, which is a reasonable expectation on a new Mac. The `mas` formula is also useful as a general tool.

### D7: `git` via brew always installs (no skip on system git)

**Decision**: For the `git` formula specifically, always run `brew install git` even if `/usr/bin/git` (system) exists. Check for brew's git path instead.

**Rationale**: macOS system git is outdated (2.x bundled with Xcode CLT). Brew git provides newer features needed by `git-delta`, `rerere`, `autoSetupRemote` etc. (as specified in the `git-dotfile-proposal`). The standard `command -v git` check would skip installation because system git exists. Instead, check if brew's git is in the PATH by verifying the brew prefix path.

### D8: chezmoi `run_once_` file naming for execution order

**Decision**: Name the defaults script `run_once_configure-macos-defaults.sh.tmpl` (alphabetically before `run_once_install-packages.sh.tmpl`).

**Rationale**: chezmoi executes `run_once_` scripts in alphabetical order. `configure-macos-defaults` sorts before `install-packages` (`c` < `i`), so system preferences are configured before any package installation begins. This is the natural order (configure the OS, then install tools). Both scripts are independent and safe to run in either order, but this sequence is more logical.

### D9: Group ordering within install script

**Decision**: New groups are inserted in this order:
1. Brew formulae (expanded) -- installs `mas` needed by group 5
2. Fonts
3. Oh-my-zsh + plugins
4. Brew casks (core + optional) -- new
5. Mac App Store apps (via mas) -- new, requires `mas` from group 1
6. NVM + Node LTS + corepack -- new
7. OpenCode plugins (existing, renumbered)
8. Claude Code plugins (existing, renumbered)
9. Manual install instructions -- new, printed last

**Rationale**: Dependencies flow downward. `mas` must be installed (group 1) before App Store apps (group 5). NVM/Node (group 6) is independent but placed after GUI apps because it takes longer (downloads + compiles). Plugin groups (7-8) remain last because they depend on their parent tools being available.

## Risks / Trade-offs

**[Cask name mapping drift]** The `cask_to_app()` function hardcodes cask-to-app-name mappings. If Homebrew or an app renames its bundle, the check fails silently (installs a duplicate or skips incorrectly).
-> Mitigation: The mapping covers only known exceptions. The default case derives the name from the cask. Worst case: brew errors out on duplicate, user skips manually. Not destructive.

**[MAS requires App Store login]** `mas install` fails if the user isn't signed into the App Store. On a fresh Mac, this is done during initial setup but could be skipped.
-> Mitigation: The MAS group has its own `confirm()` prompt and checks `mas account` status before attempting installs. If not signed in, prints instructions.

**[NVM curl script version pinning]** The NVM install URL includes a version (`v0.40.4`). This will go stale over time.
-> Mitigation: Pin to current latest and update periodically. The NVM install script is backwards-compatible and auto-updates on re-run. Could add a renovate custom manager for this URL in the future.

**[Corepack not available on older Node]** `corepack enable` requires Node >= 16.10. If the user manually installs an older Node version first, corepack fails.
-> Mitigation: The script installs `--lts` which is currently v22.x. Check `corepack --version` before enabling and warn if unavailable.

**[Large number of cask prompts for optional apps]** 11 individual confirmation prompts could be annoying.
-> Mitigation: Optional apps are asked one at a time but can all be skipped with 'n'. Could batch them as a single group in the future if the list grows.

**[`defaults write` requires restart for some settings]** Some macOS preferences don't take effect until the user logs out or restarts. `killall Finder` and `killall Dock` handle most, but keyboard repeat settings may need a logout.
-> Mitigation: Print a note at the end of the defaults script suggesting a logout for full effect.
