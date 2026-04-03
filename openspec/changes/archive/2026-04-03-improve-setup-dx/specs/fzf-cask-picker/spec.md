## ADDED Requirements

### Requirement: Cask metadata is defined in a single structured list

Each cask entry SHALL include the cask name, category, and a short human-readable description in a single data structure. Categories are: Dev, Browser, Productivity, AI, Security, Media, Optional.

#### Scenario: Adding a new cask

- **WHEN** a new cask is added to the install script
- **THEN** the cask name, category, and description are defined in one place (no separate arrays to keep in sync)

### Requirement: Installed casks are excluded from the picker

Before presenting any selection UI, the script SHALL pre-scan all cask entries against `/Applications/<AppName>.app` existence (using the existing `cask_to_app()` mapping). Already-installed apps SHALL NOT appear in the fzf picker or direct prompts.

#### Scenario: All casks already installed

- **WHEN** every cask in the list has a matching `.app` in `/Applications/`
- **THEN** the script prints "GUI apps: N/N installed" and skips the group entirely without prompting

#### Scenario: Some casks already installed

- **WHEN** 15 of 30 casks are already installed
- **THEN** only the 15 uninstalled casks appear in the selection UI

### Requirement: Adaptive prompt based on pending count

The script SHALL use different UX based on the number of pending (uninstalled) casks:

- **0 pending**: Silent skip with summary message
- **1-3 pending**: Individual `confirm()` prompt per app, including the cask description
- **4+ pending**: fzf multi-select picker

#### Scenario: Zero pending casks

- **WHEN** all casks are already installed
- **THEN** the script prints a summary line and does not prompt the user

#### Scenario: Two pending casks

- **WHEN** exactly 2 casks are not yet installed (e.g., notion, arc)
- **THEN** the script prompts individually: "Install notion (Productivity workspace)? [Y/n]" for each

#### Scenario: Ten pending casks

- **WHEN** 10 or more casks are not yet installed
- **THEN** the script opens an fzf multi-select picker with all pending casks

### Requirement: fzf picker displays category prefix and description

Each line in the fzf picker SHALL follow the format: `[Category] cask-name    description`. The fzf header SHALL display keybinding hints: TAB = toggle, Ctrl-A = select all, ENTER = confirm.

#### Scenario: User sees the picker

- **WHEN** the fzf picker opens with 10+ pending casks
- **THEN** each line shows `[Category] cask-name` followed by a short description, and the header shows keybinding hints

#### Scenario: User filters by category

- **WHEN** the user types "Dev" in the fzf search
- **THEN** only lines with `[Dev]` prefix are shown

### Requirement: All items start deselected in fzf picker

The fzf picker SHALL open with no items pre-selected. Users opt in via Ctrl-A (select all) then deselect unwanted items, or by selecting individual items with TAB.

#### Scenario: User confirms without selecting anything

- **WHEN** the user presses ENTER without selecting any items
- **THEN** no casks are installed and the script continues to the next group

#### Scenario: User selects all then deselects some

- **WHEN** the user presses Ctrl-A then deselects 3 items and presses ENTER
- **THEN** only the remaining selected casks are installed

### Requirement: Fallback when fzf is unavailable

If `fzf` is not in PATH when the cask group runs, the script SHALL fall back to listing all pending casks with descriptions and presenting a single confirm prompt for all.

#### Scenario: fzf not installed

- **WHEN** Group 1 (brew formulae) was skipped and fzf is not available
- **THEN** the script prints the full list of pending casks with descriptions and asks "Install all N pending GUI apps? [Y/n]"

### Requirement: MAS apps use the same adaptive pattern

Mac App Store apps SHALL use the same adaptive threshold behavior (0=skip, 1-3=direct prompt with description, 4+=fzf picker). The `mas list` command SHALL be used to determine which apps are already installed.

#### Scenario: Both MAS apps already installed

- **WHEN** `mas list` output contains both app IDs
- **THEN** the script prints "App Store apps: 2/2 installed" and skips without prompting

#### Scenario: One MAS app missing

- **WHEN** one MAS app is not in `mas list` output
- **THEN** the script prompts: "Install Perplexity (AI search assistant)? [Y/n]"
