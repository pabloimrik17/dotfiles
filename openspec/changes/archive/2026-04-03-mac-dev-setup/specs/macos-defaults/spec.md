## ADDED Requirements

### Requirement: macOS defaults script exists as separate chezmoi run_once file

The system SHALL provide a `run_once_configure-macos-defaults.sh.tmpl` file that chezmoi executes once on first apply. The script SHALL only run on macOS (guarded by chezmoi `{{ if eq .chezmoi.os "darwin" }}` template). The filename SHALL sort alphabetically before `run_once_install-packages.sh.tmpl` (`configure` < `install`).

#### Scenario: Script runs on macOS

- **WHEN** `chezmoi apply` is executed on a macOS machine for the first time
- **THEN** the macOS defaults script executes before the install-packages script

#### Scenario: Script skipped on non-macOS

- **WHEN** `chezmoi apply` is executed on a non-macOS machine
- **THEN** the macOS defaults script produces an empty file (chezmoi template guard)

### Requirement: Finder preferences are configured

The script SHALL apply the following Finder defaults:

- `AppleShowAllFiles` = `true` (show hidden files)
- `ShowPathbar` = `true`
- `ShowStatusBar` = `true`
- `FXRemoveOldTrashItems` = `true` (empty trash after 30 days)
- `_FXSortFoldersFirst` = `true` (folders before files)
- `FXEnableExtensionChangeWarning` = `false` (no warning on extension change)
- `NewWindowTarget` = `PfLo` with `NewWindowTargetPath` = `file://$HOME/Downloads/`
- `AppleShowAllExtensions` = `true` (via NSGlobalDomain)
- `chflags nohidden ~/Library` (unhide Library folder)

#### Scenario: Finder defaults applied on fresh Mac

- **WHEN** the script runs on a Mac with default Finder settings
- **THEN** all 9 Finder preferences are set to the specified values

#### Scenario: Finder defaults are idempotent

- **WHEN** the script runs on a Mac where Finder preferences are already set
- **THEN** the same values are written (no error, no change in behavior)

### Requirement: Dock preferences are configured

The script SHALL apply the following Dock defaults:

- `autohide` = `true`
- `show-recents` = `false`
- `tilesize` = `62`

#### Scenario: Dock defaults applied

- **WHEN** the script runs
- **THEN** Dock auto-hides, recent apps are hidden, and tile size is set to 62

### Requirement: Trackpad preferences are configured

The script SHALL set `com.apple.AppleMultitouchTrackpad Clicking` = `true` (tap to click).

#### Scenario: Tap to click enabled

- **WHEN** the script runs
- **THEN** trackpad tap-to-click is enabled

### Requirement: Keyboard preferences are configured

The script SHALL apply the following keyboard defaults via NSGlobalDomain:

- `NSAutomaticCapitalizationEnabled` = `false`
- `NSAutomaticDashSubstitutionEnabled` = `false`
- `NSAutomaticQuoteSubstitutionEnabled` = `false`
- `NSAutomaticPeriodSubstitutionEnabled` = `false`
- `KeyRepeat` = `2` (fast key repeat)
- `InitialKeyRepeat` = `15` (short initial delay)

#### Scenario: Keyboard text substitutions disabled

- **WHEN** the script runs
- **THEN** auto-capitalize, smart dashes, smart quotes, and double-space period are all disabled

#### Scenario: Key repeat speed is fast

- **WHEN** the script runs
- **THEN** KeyRepeat is set to 2 and InitialKeyRepeat is set to 15

### Requirement: Hot corners are disabled

The script SHALL set all four hot corners to 0 (disabled) via `com.apple.dock wvous-{tl,tr,bl,br}-corner`.

#### Scenario: All hot corners disabled

- **WHEN** the script runs
- **THEN** all four corner triggers are set to 0

### Requirement: Miscellaneous system preferences are configured

The script SHALL:

- Set `com.apple.Preview ApplePersistenceIgnoreState` = `YES` (don't restore previous files)
- Set `com.apple.Siri StatusMenuVisible` = `false` (hide Siri from menu bar)

#### Scenario: Preview and Siri configured

- **WHEN** the script runs
- **THEN** Preview does not restore previous files and Siri is hidden from the menu bar

### Requirement: Affected system services are restarted

The script SHALL execute `killall Finder` and `killall Dock` after applying defaults. Both commands SHALL suppress errors if the processes are not running (append `2>/dev/null || true`).

#### Scenario: Finder and Dock restarted

- **WHEN** all defaults are written
- **THEN** Finder and Dock processes are restarted to apply changes

#### Scenario: Restart tolerates missing processes

- **WHEN** Finder or Dock is not running (e.g., headless environment)
- **THEN** the killall commands do not produce errors and the script continues

### Requirement: Script prints a logout advisory

The script SHALL print an informational message after applying defaults advising the user that some settings (notably KeyRepeat/InitialKeyRepeat) may require a logout to take full effect.

#### Scenario: Advisory printed

- **WHEN** the script completes
- **THEN** a message like `[dotfiles] Note: some settings may require logout to take full effect` is printed to stdout
