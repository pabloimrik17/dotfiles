## ADDED Requirements

### Requirement: Clipboard read requires user confirmation

The Ghostty config SHALL include `clipboard-read = ask` so that OSC 52 clipboard read requests trigger a confirmation dialog instead of being silently denied or allowed. This enables tools like tmux (clipboard sync), neovim over SSH, and shell scripts to read clipboard contents while preventing silent exfiltration by untrusted programs.

#### Scenario: User allows clipboard read

- **WHEN** tmux sends an OSC 52 clipboard read request for clipboard sync
- **AND** the user clicks "Allow" in the confirmation dialog
- **THEN** Ghostty returns the clipboard contents to tmux

#### Scenario: User denies clipboard read

- **WHEN** an unknown terminal program sends an OSC 52 clipboard read request
- **AND** the user clicks "Deny" in the confirmation dialog
- **THEN** Ghostty blocks the read and the program receives no clipboard data

#### Scenario: Setting is documented inline

- **WHEN** a user reads the Ghostty config file
- **THEN** a comment above `clipboard-read = ask` explains the security rationale (why `ask` over `allow`)
