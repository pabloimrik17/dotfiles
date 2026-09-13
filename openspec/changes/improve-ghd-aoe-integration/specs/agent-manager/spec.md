## RENAMED Requirements

- FROM: `### Requirement: No automated invocations of `aoe` from any chezmoi-managed script`
- TO: `### Requirement: AoE interactive startup remains user-initiated`

## MODIFIED Requirements

### Requirement: AoE interactive startup remains user-initiated

The dotfiles SHALL NOT open the interactive AoE TUI from chezmoi install/apply scripts, git hooks, shell startup or other unattended entry points. An explicit user action SHALL remain necessary to open that TUI. User-triggered gh-dash shortcuts SHALL be allowed to invoke AoE's non-interactive group, session registration, inspection and lifecycle commands through the shared integration, returning control without opening or attaching to the TUI.

#### Scenario: No automated aoe invocation

- **WHEN** chezmoi scripts, git hooks or shell startup run
- **THEN** they do not open or attach to the AoE TUI

#### Scenario: Explicit shortcut manages sessions

- **WHEN** the user presses `f` or `F` in gh-dash
- **THEN** the integration can inspect groups and sessions, register or reuse the PR session and perform the requested background lifecycle operation
- **AND** it does not open or attach to the AoE TUI

#### Scenario: User opens AoE

- **WHEN** the user explicitly launches `aoe`
- **THEN** the interactive TUI opens normally
