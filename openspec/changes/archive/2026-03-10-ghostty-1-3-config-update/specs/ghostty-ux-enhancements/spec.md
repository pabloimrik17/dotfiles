## ADDED Requirements

### Requirement: Native scrollbar uses system default

The Ghostty config SHALL include `scrollbar = system` to use the native macOS overlay scrollbar that appears during scrolling and auto-hides.

#### Scenario: Scrollbar appears on scroll

- **WHEN** the user scrolls through terminal output
- **THEN** a native macOS overlay scrollbar appears and auto-hides after scrolling stops

#### Scenario: Scrollbar respects macOS system preferences

- **WHEN** the user has configured scrollbar behavior in macOS System Settings
- **THEN** Ghostty's scrollbar follows that system preference (always visible, when scrolling, etc.)

## MODIFIED Requirements

### Requirement: New tabs and splits inherit working directory

The Ghostty config SHALL include granular working directory inheritance options:

- `tab-inherit-working-directory = true`
- `split-inherit-working-directory = true`
- `window-inherit-working-directory = true`

These replace the single `window-inherit-working-directory = true` option with explicit per-surface-type control, all set to true to preserve current behavior.

#### Scenario: New tab inherits directory

- **WHEN** the user is in `~/projects/myapp` and opens a new tab with Cmd+T
- **THEN** the new tab starts in `~/projects/myapp`

#### Scenario: New split inherits directory

- **WHEN** the user is in `~/projects/myapp` and creates a split
- **THEN** the new split starts in `~/projects/myapp`

#### Scenario: New window inherits directory

- **WHEN** the user is in `~/projects/myapp` and opens a new window
- **THEN** the new window starts in `~/projects/myapp`

#### Scenario: First window uses default

- **WHEN** Ghostty launches with no previous terminal surface
- **THEN** the working directory falls back to the default (home directory on macOS when launched from launchd)
