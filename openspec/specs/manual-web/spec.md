## ADDED Requirements

### Requirement: Browsable HTML manual with all dotfiles shortcuts and flows

The system SHALL provide a single `docs/manual.html` file that displays all aliases, keybindings, functions, and workflow guides organized by area. The file SHALL have zero external dependencies — all CSS and JS embedded inline.

#### Scenario: Open manual from filesystem

- **WHEN** user opens `docs/manual.html` in a browser via `file://` or local server
- **THEN** the manual renders with Catppuccin Mocha dark theme, sidebar navigation, and all 12 content sections

### Requirement: Catppuccin Mocha dark theme

The manual SHALL use the Catppuccin Mocha color palette for all screen rendering: base `#1e1e2e`, text `#cdd6f4`, surface colors, and accent colors matching the dotfiles terminal theme.

#### Scenario: Visual consistency with terminal

- **WHEN** user views the manual on screen
- **THEN** background, text, and accent colors match the Catppuccin Mocha palette defined in `starship.toml` and `ghostty/config`

### Requirement: Sidebar navigation

The manual SHALL display a sticky sidebar on the left with anchor links to each of the 12 content sections. Clicking a link SHALL scroll to that section.

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
