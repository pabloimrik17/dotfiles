# Spec Delta: gh-dash-config

## REMOVED Requirements

### Requirement: Claude Code review keybinding

**Reason**: Direct Claude review shortcuts are being retired. The custom `C` shortcut required here does not exist in the current configuration.
**Migration**: Start Claude review outside gh-dash or use the existing `F` AoE review-team shortcut.

#### Scenario: Former Claude review shortcut

- **WHEN** the retired custom `C` review binding is considered
- **THEN** gh-dash no longer requires a custom command that opens a tmux window and launches Claude Code review
