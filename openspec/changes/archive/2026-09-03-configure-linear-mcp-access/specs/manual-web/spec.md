## RENAMED Requirements

- FROM: `### Requirement: 14 content sections`
- TO: `### Requirement: 15 content sections`

## MODIFIED Requirements

### Requirement: Browsable HTML manual with all dotfiles shortcuts and flows

The system SHALL provide a single `docs/manual.html` file that displays all aliases, keybindings, functions, and workflow guides organized by area. The file SHALL have zero external dependencies — all CSS and JS embedded inline.

#### Scenario: Open manual from filesystem

- **WHEN** user opens `docs/manual.html` in a browser via `file://` or local server
- **THEN** the manual renders with Catppuccin Mocha dark theme, sidebar navigation, and all 15 content sections

### Requirement: Sidebar navigation

The manual SHALL display a sticky sidebar on the left with anchor links to each of the 15 content sections. Clicking a link SHALL scroll to that section.

#### Scenario: Navigate to section

- **WHEN** user clicks "Git" in the sidebar
- **THEN** the page scrolls to the Git section

### Requirement: 15 content sections

The manual SHALL contain these sections in order:

1. Terminal (Ghostty), 2. Navigation & Search, 3. Files & Viewing, 4. Git, 5. Worktrees, 6. Package Managers, 7. Shell Productivity, 8. Brew, 9. Docker, 10. macOS Integration, 11. Claude Code, 12. OpenCode, 13. Codex, 14. Junie, 15. Agent Sessions

Each section SHALL reflect current shipped tool capabilities. The Codex section SHALL describe the narrowly managed Linear MCP registration without claiming that chezmoi owns the rest of Codex preferences or runtime state. The Junie section SHALL document the managed user-scope Linear MCP file, mark Linear access as not currently supported, explain the reproduced OAuth token-exchange failure, and provide a future revalidation path.

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
- **THEN** it documents standalone installation, first-run authentication, self-updating, completion generation, `AGENTS.md`, `.agents/skills` discovery, and Linear MCP registration, login, and verification
- **AND** it explains that other Codex preferences and runtime state remain Codex-owned

#### Scenario: Junie section reflects shipped behavior

- **WHEN** user views Section 14 (Junie)
- **THEN** it documents `~/.junie/mcp/mcp.json`, the credential-free Linear endpoint preconfiguration, and the attempted `/mcp` authorization flow
- **AND** it labels Junie as not currently supported because Linear OAuth returns `Client must not use multiple authentication methods`
- **AND** it reserves connection and functional verification instructions for a future Junie release that completes OAuth successfully

#### Scenario: Agent Sessions remains last

- **WHEN** user inspects the sidebar or page content order
- **THEN** Agent Sessions is Section 15 and follows Junie

#### Scenario: All sections present

- **WHEN** the manual is loaded
- **THEN** all 15 sections are present in the sidebar and in the page content

## ADDED Requirements

### Requirement: Linear MCP workflows are documented per client

The manual SHALL give distinct setup and support-status instructions for Claude Code, OpenCode, Codex, and Junie. It SHALL give authentication, connection-status, and acceptance instructions for Claude Code, OpenCode, and Codex. For Junie, it SHALL explain the current OAuth incompatibility, prohibit credential workarounds, and describe how to repeat the controlled authorization check after an update. It SHALL explain that all configured clients use the same official read-write endpoint while configuration and credential stores remain client-specific.

#### Scenario: Reader understands authentication support for every client

- **WHEN** a user follows the four client subsections
- **THEN** the documented flow covers Claude Code `/mcp` or `claude mcp login linear`, `opencode mcp auth linear`, and `codex mcp login linear`
- **AND** the Junie subsection marks `/mcp` Authorize as a currently failing compatibility check to revisit, not a working login path

#### Scenario: Reader verifies functional access

- **WHEN** a user reaches the verification step in any client subsection
- **THEN** each supported-client subsection instructs them to list projects, find `dotfiles`, create a uniquely named disposable issue in that project, record its identifier, and close or cancel it after verification
- **AND** the Junie subsection instructs them not to create an acceptance issue until OAuth succeeds and the server reports Active
