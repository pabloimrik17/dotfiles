# Capability: ghostty-quick-terminal

## Purpose

Configure Ghostty's quick terminal (drop-down terminal) feature — position, size, animation, screen selection, auto-hide behavior, space-switching behavior, and global keybind — to provide a fast, globally accessible terminal overlay on macOS.

## Requirements

### Requirement: Quick terminal appears from the top of the screen

The Ghostty config SHALL include `quick-terminal-position = top` so that the drop-down terminal slides in from the top edge of the screen.

#### Scenario: Quick terminal position

- **WHEN** the user toggles the quick terminal
- **THEN** it appears sliding down from the top of the screen

### Requirement: Quick terminal occupies 40% of screen height

The Ghostty config SHALL include `quick-terminal-size = 40%` so that the drop-down terminal covers 40% of the screen height when open.

#### Scenario: Quick terminal size

- **WHEN** the quick terminal is open
- **THEN** it occupies approximately 40% of the screen height, leaving the lower 60% visible

### Requirement: Quick terminal appears on the main screen

The Ghostty config SHALL include `quick-terminal-screen = main` so that the quick terminal appears on the screen currently receiving keyboard input (as determined by macOS).

#### Scenario: Quick terminal screen selection

- **WHEN** the user toggles the quick terminal while working on a specific display
- **THEN** the quick terminal appears on the screen that macOS designates as the main screen (the one receiving keyboard input)

### Requirement: Quick terminal has a smooth animation

The Ghostty config SHALL include `quick-terminal-animation-duration = 0.2` for a 200ms slide-in/slide-out animation.

#### Scenario: Animation duration

- **WHEN** the quick terminal is toggled open or closed
- **THEN** it animates over approximately 0.2 seconds

### Requirement: Quick terminal follows between macOS Spaces

The Ghostty config SHALL include `quick-terminal-space-behavior = move` so that the quick terminal moves with the user when switching between macOS Spaces/virtual desktops.

#### Scenario: Space switching

- **WHEN** the user switches to a different macOS Space
- **THEN** the quick terminal is available in the new Space (not left behind in the original Space)

### Requirement: Quick terminal auto-hides on focus loss

The Ghostty config SHALL include `quick-terminal-autohide = true` so that the quick terminal disappears when the user clicks on another window or switches focus away.

#### Scenario: Auto-hide on focus change

- **WHEN** the quick terminal is open and the user clicks on another application window
- **THEN** the quick terminal automatically hides

### Requirement: Global keybind toggles the quick terminal

The Ghostty config SHALL include `keybind = global:super+shift+t=toggle_quick_terminal` to toggle the quick terminal from any application using Cmd+Shift+T.

#### Scenario: Toggle from another application

- **WHEN** the user presses Cmd+Shift+T while focused on any application (e.g., a browser)
- **THEN** the quick terminal appears (or hides if already visible)

#### Scenario: Keybind does not conflict with existing bindings

- **WHEN** the existing keybind `super+t=new_tab` is configured
- **THEN** `super+shift+t` (with Shift) is a distinct binding and does not interfere with `super+t` (without Shift)

#### Scenario: Accessibility permissions required

- **WHEN** the `global:` keybind is configured but Ghostty does not have Accessibility permissions
- **THEN** Ghostty prompts the user to grant permissions in System Settings > Privacy & Security > Accessibility
