## ADDED Requirements

### Requirement: Vertical split keybinding

The Ghostty config SHALL include `keybind = super+d=new_split:right` to create a vertical split (new pane to the right).

#### Scenario: Create vertical split

- **WHEN** the user presses Cmd+D in Ghostty
- **THEN** a new split appears to the right of the current pane, inheriting the working directory

### Requirement: Horizontal split keybinding

The Ghostty config SHALL include `keybind = super+shift+d=new_split:down` to create a horizontal split (new pane below).

#### Scenario: Create horizontal split

- **WHEN** the user presses Cmd+Shift+D in Ghostty
- **THEN** a new split appears below the current pane, inheriting the working directory

### Requirement: Split navigation keybindings

The Ghostty config SHALL include directional split navigation keybindings using `super+alt+arrow`:

- `keybind = super+alt+left=goto_split:left`
- `keybind = super+alt+right=goto_split:right`
- `keybind = super+alt+up=goto_split:top`
- `keybind = super+alt+down=goto_split:bottom`

#### Scenario: Navigate to adjacent split

- **WHEN** the user has multiple splits open and presses Cmd+Alt+Right
- **THEN** focus moves to the split to the right of the current one

#### Scenario: No split in direction

- **WHEN** the user presses Cmd+Alt+Left and there is no split to the left
- **THEN** focus remains on the current split (no-op)

### Requirement: Split resize keybindings

The Ghostty config SHALL include directional split resize keybindings using `super+ctrl+arrow` with a 40px increment:

- `keybind = super+ctrl+left=resize_split:left,40`
- `keybind = super+ctrl+right=resize_split:right,40`
- `keybind = super+ctrl+up=resize_split:up,40`
- `keybind = super+ctrl+down=resize_split:down,40`

#### Scenario: Resize split boundary

- **WHEN** the user presses Cmd+Ctrl+Right with multiple splits
- **THEN** the split boundary moves 40px to the right

#### Scenario: Repeated resize

- **WHEN** the user presses Cmd+Ctrl+Right multiple times
- **THEN** the boundary moves 40px per keypress, accumulating the resize

### Requirement: Toggle split zoom keybinding

The Ghostty config SHALL include `keybind = super+shift+enter=toggle_split_zoom` to temporarily fullscreen the active split.

#### Scenario: Zoom active split

- **WHEN** the user presses Cmd+Shift+Enter with multiple splits
- **THEN** the active split takes up the full terminal area, hiding other splits

#### Scenario: Unzoom split

- **WHEN** the user presses Cmd+Shift+Enter while a split is zoomed
- **THEN** all splits return to their previous layout

### Requirement: Equalize splits keybinding

The Ghostty config SHALL include `keybind = super+shift+equal=equalize_splits` to reset all splits to equal sizes.

#### Scenario: Equalize after manual resize

- **WHEN** the user has resized splits to unequal proportions and presses Cmd+Shift+=
- **THEN** all splits in the current tab return to equal sizes

### Requirement: Split keybindings are grouped in config

All split-related keybindings SHALL be grouped under a `# Splits` comment section in the Ghostty config, placed after the existing tab keybindings.

#### Scenario: Config organization

- **WHEN** a user reads the Ghostty config file
- **THEN** split keybindings appear in a clearly labeled section separate from tab keybindings
