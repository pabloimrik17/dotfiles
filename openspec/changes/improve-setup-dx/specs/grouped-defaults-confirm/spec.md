## ADDED Requirements

### Requirement: macOS defaults are grouped by system area

The macOS defaults script SHALL organize settings into 6 groups: Finder, Dock, Trackpad, Keyboard, Hot corners, Misc. Each group SHALL be prompted independently with [Y/n].

#### Scenario: User accepts Finder but declines Dock

- **WHEN** the user answers Y to Finder settings and N to Dock settings
- **THEN** only Finder-related `defaults write` commands are executed; Dock settings are skipped

#### Scenario: User declines all groups

- **WHEN** the user answers N to every group
- **THEN** no `defaults write` commands are executed and no services are restarted

### Requirement: Each group shows a descriptive preview before prompting

Before each [Y/n] prompt, the script SHALL print a bulleted list of every setting in the group with a human-readable description of what it does.

#### Scenario: Finder group preview

- **WHEN** the Finder group is about to prompt
- **THEN** the script prints each Finder setting with a description (e.g., "Show hidden files (dotfiles, .git become visible)", "Show path bar (full path at bottom of window)", "Auto-delete Trash after 30 days")

#### Scenario: Keyboard group preview

- **WHEN** the Keyboard group is about to prompt
- **THEN** the script prints each Keyboard setting with a description (e.g., "Disable auto-capitalize", "Disable smart dashes (-- instead of —)", "Fast key repeat (KeyRepeat=2, InitialKeyRepeat=15)")

### Requirement: Service restarts are scoped to accepted groups

The script SHALL only restart services (killall Finder, killall Dock) for groups that were accepted. If only Keyboard settings were applied, neither Finder nor Dock SHALL be restarted.

#### Scenario: Only Finder accepted

- **WHEN** the user accepts Finder but declines Dock
- **THEN** `killall Finder` is executed but `killall Dock` is not

#### Scenario: Only Dock accepted

- **WHEN** the user accepts Dock but declines Finder
- **THEN** `killall Dock` is executed but `killall Finder` is not

#### Scenario: Neither Finder nor Dock accepted

- **WHEN** the user declines both Finder and Dock groups
- **THEN** neither `killall Finder` nor `killall Dock` is executed
