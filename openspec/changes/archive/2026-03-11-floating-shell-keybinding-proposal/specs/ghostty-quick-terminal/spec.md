## MODIFIED Requirements

### Requirement: Global keybind toggles the quick terminal

The Ghostty config SHALL include `keybind = global:ctrl+º=toggle_quick_terminal` to toggle the quick terminal from any application using Ctrl+º (Ctrl+Backquote on W3C physical key layout).

#### Scenario: Toggle from another application

- **WHEN** the user presses Ctrl+º (Ctrl+Backquote) while focused on any application (e.g., a browser)
- **THEN** the quick terminal appears (or hides if already visible)

#### Scenario: Keybind does not conflict with browser shortcuts

- **WHEN** the user presses Cmd+Shift+T in Chrome
- **THEN** Chrome's "reopen closed tab" works normally, unaffected by Ghostty

#### Scenario: Keybind does not conflict with macOS system shortcuts

- **WHEN** the user presses Cmd+º (super+backquote) in any application
- **THEN** macOS "switch windows of same app" works normally, unaffected by Ghostty

#### Scenario: Accessibility permissions required

- **WHEN** the `global:` keybind is configured but Ghostty does not have Accessibility permissions
- **THEN** Ghostty prompts the user to grant permissions in System Settings > Privacy & Security > Accessibility
