## MODIFIED Requirements

### Requirement: Descriptive comment
Each setting in `dot_tmux.conf` SHALL have a comment line above it explaining its purpose, matching the existing comment style.

#### Scenario: All settings commented
- **WHEN** reading `dot_tmux.conf`
- **THEN** every `set` and `bind` directive has a comment above it describing its purpose
