## Purpose

Provide a browsable HTML manual documenting all dotfiles aliases, keybindings, functions, and workflow guides.
## Requirements
### Requirement: Browsable HTML manual with all dotfiles shortcuts and flows

The system SHALL provide a single `docs/manual.html` file that displays all aliases, keybindings, functions, and workflow guides organized by area. The file SHALL have zero external dependencies — all CSS and JS embedded inline.

#### Scenario: Open manual from filesystem

- **WHEN** user opens `docs/manual.html` in a browser via `file://` or local server
- **THEN** the manual renders with Catppuccin Mocha dark theme, sidebar navigation, and all 15 content sections

### Requirement: Catppuccin Mocha dark theme

The manual SHALL use the Catppuccin Mocha color palette for all screen rendering: base `#1e1e2e`, text `#cdd6f4`, surface colors, and accent colors matching the dotfiles terminal theme.

#### Scenario: Visual consistency with terminal

- **WHEN** user views the manual on screen
- **THEN** background, text, and accent colors match the Catppuccin Mocha palette defined in `starship.toml` and `ghostty/config`

### Requirement: Sidebar navigation

The manual SHALL display a sticky sidebar on the left with anchor links to each of the 15 content sections. Clicking a link SHALL scroll to that section.

#### Scenario: Navigate to section

- **WHEN** user clicks "Git" in the sidebar
- **THEN** the page scrolls to the Git section

### Requirement: Collapsible sections

Each content section SHALL be wrapped in a `<details>`/`<summary>` element, allowing users to collapse/expand sections.

#### Scenario: Collapse a section

- **WHEN** user clicks the section header
- **THEN** the section content collapses, hiding its tables and flows

#### Scenario: All sections expanded by default

- **WHEN** the manual loads
- **THEN** all sections are expanded (open by default)

### Requirement: Live search filter (Ctrl+K)

The manual SHALL provide a search input activated by `Ctrl+K` (or clicking the search box). Typing SHALL filter visible content — hiding sections and table rows that don't match the query (case-insensitive substring match).

#### Scenario: Filter by keyword

- **WHEN** user presses Ctrl+K and types "stash"
- **THEN** only sections/rows containing "stash" remain visible (e.g., Git section with gsta/gstp/gstl)

#### Scenario: Clear filter

- **WHEN** user clears the search input or presses Escape
- **THEN** all sections and rows become visible again

### Requirement: Shortcut tables per section

Each section SHALL contain a `<table>` listing aliases/keybindings with columns: shortcut/alias, expansion/description.

#### Scenario: View eza aliases

- **WHEN** user scrolls to the Files & Viewing section
- **THEN** a table lists all eza aliases (ls, ll, la, lt, lta, lla, ldev, lcode, lsize) with their expansions

### Requirement: Workflow flow guides

Sections with notable workflows SHALL include narrative step-by-step flow blocks explaining the full usage pattern, not just the alias.

#### Scenario: View git feature flow

- **WHEN** user reads the Git section
- **THEN** a flow block describes the full cycle: create branch → code → stage → commit → push → PR, using the actual aliases

### Requirement: Keyboard hint styling

Keybindings SHALL be rendered with `<kbd>` elements for visual distinction (e.g., `Ctrl+Z`, `Esc Esc`, `⌘⇧T`).

#### Scenario: Keyboard shortcut display

- **WHEN** user views a keybinding entry
- **THEN** the key combination appears in a styled `<kbd>` tag visually distinct from regular text

### Requirement: 15 content sections

The manual SHALL contain these sections in order:

1. Terminal (Ghostty), 2. Navigation & Search, 3. Files & Viewing, 4. Git, 5. Worktrees, 6. Package Managers, 7. Shell Productivity, 8. Brew, 9. Docker, 10. macOS Integration, 11. Claude Code, 12. OpenCode, 13. Codex, 14. Junie, 15. Agent Sessions

Each section SHALL reflect current shipped tool capabilities. The Codex section SHALL describe the narrowly managed DeepWiki and Linear MCP registrations without claiming that chezmoi owns the rest of Codex preferences or runtime state. The Junie section SHALL document the managed user-scope DeepWiki and Linear MCP entries, mark Linear access as not currently supported, explain the reproduced OAuth token-exchange failure, and provide a future revalidation path.

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
- **THEN** it documents standalone installation, first-run authentication, self-updating, completion generation, `AGENTS.md`, `.agents/skills` discovery, DeepWiki registration, and Linear MCP registration, login, and verification
- **AND** it explains that other Codex preferences and runtime state remain Codex-owned

#### Scenario: Junie section reflects shipped behavior

- **WHEN** user views Section 14 (Junie)
- **THEN** it documents `~/.junie/mcp/mcp.json`, the credential-free DeepWiki and Linear endpoint preconfiguration, and the attempted Linear `/mcp` authorization flow
- **AND** it labels Junie as not currently supported because Linear OAuth returns `Client must not use multiple authentication methods`
- **AND** it reserves connection and functional verification instructions for a future Junie release that completes OAuth successfully

#### Scenario: Agent Sessions remains last

- **WHEN** user inspects the sidebar or page content order
- **THEN** Agent Sessions is Section 15 and follows Junie

#### Scenario: All sections present

- **WHEN** the manual is loaded
- **THEN** all 15 sections are present in the sidebar and in the page content

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

### Requirement: Destructive commands are never described as read-only

The manual SHALL NOT describe a command as read-only, non-destructive, or inspection-only unless it cannot delete or move user data.

Where a command is destructive behind an interactive confirmation, the manual SHALL say so, and SHALL name the genuinely read-only alternative if one exists.

This is not hypothetical: the disk-usage explorer is currently listed both as "read-only" and among the non-destructive commands, while the installed binary can move selected paths to the Trash after an Enter confirmation. Its `--help` documents only an output flag, so the capability is invisible to anyone who checks the obvious place.

#### Scenario: Disk-usage explorer is described accurately

- **WHEN** a reader consults the manual entry for the disk-usage explorer
- **THEN** it SHALL state that the command can move selected items to the Trash after confirmation

#### Scenario: Non-destructive list excludes it

- **WHEN** the manual enumerates commands that only inspect or simulate
- **THEN** the disk-usage explorer SHALL NOT appear in that list

#### Scenario: Read-only alternative is documented

- **WHEN** a reader wants a purely observational system view
- **THEN** the manual SHALL document the read-only status dashboard as the alternative

### Requirement: Documented shell helpers exist

Every shell function, alias, or command the manual instructs the reader to run SHALL exist in the shipped configuration.

The manual currently prescribes four helper functions that were removed when their functionality migrated to television. A reader following the instructions gets `command not found`, and one of them is presented inside a step-by-step flow.

#### Scenario: Every documented helper resolves

- **WHEN** each shell helper named in the manual is looked up in the shipped shell configuration
- **THEN** a definition SHALL be found for it

#### Scenario: Superseded helpers point at their replacements

- **WHEN** a helper documented in the manual has been replaced by a television channel
- **THEN** the manual SHALL name the channel instead of the removed helper

### Requirement: Manual claims about tool configuration match the shipped config

Where the manual explains how a feature is enabled, that explanation SHALL match the configuration the repo actually ships and the behaviour of the installed version.

The manual currently states that pull-request badges in the git TUI require two configuration flags together. One of them is inert — it is a deprecated key whose only consumer is unreachable once the other is set — and since the TUI's current release an open pull request renders its status as plain Unicode needing no icon font at all.

#### Scenario: Enablement instructions are accurate

- **WHEN** the manual explains how a feature is turned on
- **THEN** the named configuration keys SHALL be ones that actually affect the behaviour

#### Scenario: Deprecated keys are not taught

- **WHEN** a configuration key is deprecated and inert in the shipped setup
- **THEN** the manual SHALL NOT instruct the reader to set it
