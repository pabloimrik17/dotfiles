## ADDED Requirements

### Requirement: Karabiner installation
The install script SHALL include `karabiner-elements` in the brew casks group.

#### Scenario: Fresh install includes Karabiner
- **WHEN** user runs the install script and confirms the brew casks group
- **THEN** Karabiner-Elements is installed via `brew install --cask karabiner-elements`

### Requirement: Configuration file managed by Chezmoi
A Karabiner config file SHALL exist at `dot_config/karabiner/karabiner.json` managed by Chezmoi. The file SHALL be valid JSON conforming to Karabiner-Elements configuration schema.

#### Scenario: Config applied by chezmoi
- **WHEN** `chezmoi apply` runs
- **THEN** `~/.config/karabiner/karabiner.json` exists with the correct remaps

### Requirement: Caps Lock remapped to Left Control
The Karabiner config SHALL include a `simple_modification` that maps `caps_lock` to `left_control` for all devices.

#### Scenario: Caps Lock acts as Control
- **WHEN** user presses Caps Lock + C
- **THEN** the system receives Ctrl+C

#### Scenario: Caps Lock no longer toggles caps
- **WHEN** user presses Caps Lock alone
- **THEN** nothing happens (no caps lock toggle)

### Requirement: Ctrl+HJKL mapped to arrow keys
The Karabiner config SHALL include `complex_modifications` rules that map Left Control + H/J/K/L to Left/Down/Up/Right arrow keys respectively. The rules SHALL also work with modifier combinations (Shift, Alt, Cmd) for selection and word navigation.

#### Scenario: Ctrl+H produces left arrow
- **WHEN** user presses Control + H in any application
- **THEN** the system receives Left Arrow

#### Scenario: Ctrl+J produces down arrow
- **WHEN** user presses Control + J in any application
- **THEN** the system receives Down Arrow

#### Scenario: Ctrl+K produces up arrow
- **WHEN** user presses Control + K in any application
- **THEN** the system receives Up Arrow

#### Scenario: Ctrl+L produces right arrow
- **WHEN** user presses Control + L in any application
- **THEN** the system receives Right Arrow

#### Scenario: Shift+Ctrl+L selects text rightward
- **WHEN** user presses Shift + Control + L in a text field
- **THEN** the system receives Shift + Right Arrow (extending selection)

#### Scenario: Alt+Ctrl+H moves word left
- **WHEN** user presses Alt + Control + H in a text field
- **THEN** the system receives Alt + Left Arrow (move cursor one word left)
