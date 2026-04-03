## MODIFIED Requirements

### Requirement: 12 content sections

The manual SHALL contain these sections in order:

1. Terminal (Ghostty), 2. Navigation & Search, 3. Files & Viewing, 4. Git, 5. Worktrees, 6. Package Managers, 7. Shell Productivity, 8. Brew, 9. Docker, 10. macOS Integration, 11. Claude Code, 12. OpenCode

Each section SHALL reflect current tool capabilities as of the brew upgrade cycle (worktrunk 0.32, atuin 18.13, git-delta 0.19, lazygit 0.60, fd 10.4).

#### Scenario: Atuin section includes AI and daemon

- **WHEN** user views the Navigation & Search section
- **THEN** the atuin table SHALL include `atuin ai "query"` for AI command generation and a note about daemon-backed fast search

#### Scenario: Delta section includes subcommands

- **WHEN** user views the Git section under "Other git tools"
- **THEN** the delta entry SHALL mention external subcommand support (`delta rg`, `delta diff`)

#### Scenario: Lazygit section includes filtering and worktree visibility

- **WHEN** user views the Git section under "Other git tools"
- **THEN** the lazygit entry SHALL mention file view filtering and worktree branch visibility

#### Scenario: Worktrunk hooks section reflects renamed hooks

- **WHEN** user views the Worktrees section under "Hooks"
- **THEN** the hook table SHALL list `pre-start` (not `post-create`) with its description
- **AND** the hook table SHALL list `pre-remove` for settings sync back

#### Scenario: Worktrunk commands section includes new commands

- **WHEN** user views the Worktrees section under "Commands"
- **THEN** the commands table SHALL include `wt step <alias>` for custom step aliases and `wt merge --no-ff` for semi-linear merge history

#### Scenario: All sections present

- **WHEN** the manual is loaded
- **THEN** all 12 sections are present in the sidebar and in the page content
