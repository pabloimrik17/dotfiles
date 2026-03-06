## ADDED Requirements

### Requirement: Quick config reload keybind

The Ghostty config SHALL include `keybind = super+shift+comma=reload_config` to enable quickly reloading the configuration without restarting Ghostty.

#### Scenario: Reload config after editing

- **WHEN** the user presses Cmd+Shift+Comma after modifying the Ghostty config file
- **THEN** Ghostty reloads the configuration and applies changes immediately without restarting

### Requirement: Cursor can be moved by clicking at prompts

The Ghostty config SHALL include `cursor-click-to-move = true` to enable Option+click cursor positioning at shell prompts. This requires shell integration (already configured with `shell-integration = zsh`).

#### Scenario: Option+click moves cursor

- **WHEN** the user is at a shell prompt and Option+clicks at a different position in the prompt line
- **THEN** the cursor moves to the clicked position (via synthetic arrow key movements)

#### Scenario: Only works at prompts

- **WHEN** the user Option+clicks while an alternate screen application (e.g., vim) is running
- **THEN** the click-to-move behavior does NOT activate (alternate screen apps handle mouse input themselves)

### Requirement: Window state is always saved on exit

The Ghostty config SHALL include `window-save-state = always` to persist window positions, sizes, tabs, splits, and working directories whenever Ghostty exits.

#### Scenario: State restored after clean quit

- **WHEN** the user quits Ghostty with multiple tabs and splits open, then relaunches
- **THEN** all windows, tabs, splits, and their working directories are restored

#### Scenario: State restored after force quit

- **WHEN** Ghostty is force-quit or the system restarts
- **THEN** the last saved state is restored on next launch

### Requirement: Clipboard trims trailing spaces

The Ghostty config SHALL include `clipboard-trim-trailing-spaces = true` to strip trailing whitespace from text copied to the clipboard.

#### Scenario: Trailing whitespace stripped on copy

- **WHEN** the user selects and copies terminal text that has trailing spaces (common with fixed-width terminal output)
- **THEN** the clipboard content has trailing whitespace removed from each line

### Requirement: Auto-update notifications are enabled

The Ghostty config SHALL include `auto-update = check` to check for Ghostty updates and notify the user without automatically downloading or installing.

#### Scenario: Update notification

- **WHEN** a new Ghostty version is available
- **THEN** the user is notified but no automatic download or installation occurs

### Requirement: Secure keyboard input activates automatically

The Ghostty config SHALL include `macos-auto-secure-input = true` to automatically enable macOS Secure Input when a password prompt is detected.

#### Scenario: Password prompt activates secure input

- **WHEN** a password prompt is displayed in the terminal (detected by heuristics)
- **THEN** macOS Secure Input is automatically enabled, preventing other applications from reading keyboard events

#### Scenario: Secure input deactivates after password entry

- **WHEN** the password prompt is no longer displayed
- **THEN** Secure Input is automatically deactivated

### Requirement: New tabs and splits inherit working directory

The Ghostty config SHALL include `window-inherit-working-directory = true` so that new tabs and splits start in the working directory of the previously focused terminal surface.

#### Scenario: New tab inherits directory

- **WHEN** the user is in `~/projects/myapp` and opens a new tab with Cmd+T
- **THEN** the new tab starts in `~/projects/myapp`

#### Scenario: First window uses default

- **WHEN** Ghostty launches with no previous terminal surface
- **THEN** the working directory falls back to the default (home directory on macOS when launched from launchd)

### Requirement: Close confirmation is explicitly enabled

The Ghostty config SHALL include `confirm-close-surface = true` to confirm before closing a terminal surface with a running process.

#### Scenario: Confirm before closing active process

- **WHEN** the user attempts to close a terminal surface that has a running process
- **THEN** a confirmation dialog appears

#### Scenario: No confirmation at idle prompt

- **WHEN** the user closes a terminal surface sitting at an idle shell prompt (with shell integration detecting no running process)
- **THEN** the surface closes without confirmation

### ~~Requirement: URL link previews are enabled~~ — CANCELLED

~~The Ghostty config SHALL include `link-previews = true` to show a preview tooltip when hovering over a detected URL with Cmd held.~~

**Cancelled**: The `link-previews` option does not exist in Ghostty 1.2.3. This requirement cannot be implemented with the current Ghostty version.

#### ~~Scenario: URL preview on hover~~

- ~~**WHEN** the user hovers over a URL in terminal output while holding Cmd~~
- ~~**THEN** a link preview is displayed showing the URL destination~~
