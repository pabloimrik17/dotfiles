# Capability: ghostty-prompt-navigation

## Purpose

Configure Ghostty keybindings for navigating between shell prompts in the scrollback buffer, enabling quick movement through command history.

## Requirements

### Requirement: Jump to previous prompt keybinding

The Ghostty config SHALL include `keybind = super+shift+up=jump_to_prompt:-1` to enable jumping to the previous prompt in the scrollback buffer.

#### Scenario: Jump to previous prompt

- **WHEN** the user presses Cmd+Shift+Up
- **THEN** the terminal scrolls to the nearest prompt marker above the current viewport position

#### Scenario: No previous prompt available

- **WHEN** the user presses Cmd+Shift+Up and no prompt marker exists above the current position
- **THEN** nothing happens (no error, no scroll)

### Requirement: Jump to next prompt keybinding

The Ghostty config SHALL include `keybind = super+shift+down=jump_to_prompt:1` to enable jumping to the next prompt in the scrollback buffer.

#### Scenario: Jump to next prompt

- **WHEN** the user presses Cmd+Shift+Down
- **THEN** the terminal scrolls to the nearest prompt marker below the current viewport position

#### Scenario: No next prompt available

- **WHEN** the user presses Cmd+Shift+Down and no prompt marker exists below the current position
- **THEN** nothing happens (no error, no scroll)

### Requirement: Prompt navigation keybindings are grouped with tab navigation

The prompt navigation keybindings SHALL be placed immediately after the tab navigation keybindings (`super+shift+left`/`super+shift+right`) in the Keybindings section of the Ghostty config.

#### Scenario: Keybinding ordering in config file

- **WHEN** a contributor reads the Keybindings section of `dot_config/ghostty/config`
- **THEN** the `super+shift+up` and `super+shift+down` keybindings appear immediately after `super+shift+right=next_tab` and before the `goto_tab` keybindings
