## ADDED Requirements

### Requirement: Clipboard read requires user confirmation

The Ghostty config SHALL include `clipboard-read = ask` so that OSC 52 clipboard read requests trigger a confirmation dialog instead of being silently denied or allowed. This enables tools like tmux (clipboard sync), neovim over SSH, and shell scripts to read clipboard contents while preventing silent exfiltration by untrusted programs.

#### Scenario: tmux requests clipboard read

- **WHEN** tmux sends an OSC 52 clipboard read request for clipboard sync
- **THEN** Ghostty shows a confirmation dialog asking the user to allow or deny the read

#### Scenario: Untrusted program attempts clipboard read

- **WHEN** an unknown terminal program sends an OSC 52 clipboard read request
- **THEN** Ghostty shows a confirmation dialog, giving the user the choice to deny access

#### Scenario: Setting is documented inline

- **WHEN** a user reads the Ghostty config file
- **THEN** a comment above `clipboard-read = ask` explains the security rationale (why `ask` over `allow`)
