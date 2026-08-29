## RENAMED Requirements

- FROM: `### Requirement: 12 content sections`
- TO: `### Requirement: 14 content sections`

## MODIFIED Requirements

### Requirement: Browsable HTML manual with all dotfiles shortcuts and flows

The system SHALL provide a single `docs/manual.html` file that displays all aliases, keybindings, functions, and workflow guides organized by area. The file SHALL have zero external dependencies — all CSS and JS embedded inline.

#### Scenario: Open manual from filesystem

- **WHEN** user opens `docs/manual.html` in a browser via `file://` or local server
- **THEN** the manual renders with Catppuccin Mocha dark theme, sidebar navigation, and all 14 content sections

### Requirement: Sidebar navigation

The manual SHALL display a sticky sidebar on the left with anchor links to each of the 14 content sections. Clicking a link SHALL scroll to that section.

#### Scenario: Navigate to section

- **WHEN** user clicks "Git" in the sidebar
- **THEN** the page scrolls to the Git section

### Requirement: 14 content sections

The manual SHALL contain these sections in order:

1. Terminal (Ghostty), 2. Navigation & Search, 3. Files & Viewing, 4. Git, 5. Worktrees, 6. Package Managers, 7. Shell Productivity, 8. Brew, 9. Docker, 10. macOS Integration, 11. Claude Code, 12. OpenCode, 13. Codex, 14. Agent Sessions

Each section SHALL reflect current shipped tool capabilities. The Codex section SHALL document only behavior delivered by this change and SHALL NOT claim managed Codex MCP servers or preferences.

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

#### Scenario: Codex section reflects shipped behavior

- **WHEN** user views Section 13 (Codex)
- **THEN** it documents standalone installation, first-run authentication, self-updating, completion generation, `AGENTS.md`, and `.agents/skills` discovery
- **AND** it does not claim Codex MCP registrations or managed preferences

#### Scenario: Agent Sessions remains last

- **WHEN** user inspects the sidebar or page content order
- **THEN** Agent Sessions is Section 14 and follows Codex

#### Scenario: All sections present

- **WHEN** the manual is loaded
- **THEN** all 14 sections are present in the sidebar and in the page content
