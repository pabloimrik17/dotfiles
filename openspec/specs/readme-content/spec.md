## Purpose

Define the README content structure including badges, sections, and formatting for the dotfiles repository.

## Requirements

### Requirement: Shield-wall badges

README SHALL display a horizontal row of badges at the top using shields.io `for-the-badge` style. Badges SHALL include: chezmoi, macOS, Linux, zsh, Catppuccin Mocha (color #cba6f7), Starship, Ghostty.

#### Scenario: Badges render correctly

- **WHEN** user views README on GitHub
- **THEN** all badges render as a horizontal shield wall with logos and correct colors

### Requirement: Hero screenshot

README SHALL include a centered screenshot image reference below the badges pointing to `assets/terminal-overview.png`.

#### Scenario: Screenshot exists

- **WHEN** `assets/terminal-overview.png` is present
- **THEN** GitHub renders the image centered with max-width 800px

#### Scenario: Screenshot missing

- **WHEN** `assets/terminal-overview.png` does not exist
- **THEN** the README SHALL omit the hero image block entirely (no broken image rendered)

### Requirement: Introduction section

README SHALL contain a 2-3 sentence intro explaining this is a chezmoi-managed dotfiles repo for macOS (primary) with Linux support, mentioning the key tools (Ghostty, Starship, zsh, modern CLI replacements, AI tooling).

#### Scenario: User reads intro

- **WHEN** user reads the introduction
- **THEN** they understand the repo's purpose, target platform, and tool philosophy

### Requirement: What's Included overview

README SHALL contain a table listing managed tools grouped by category (Terminal, Shell, CLI Tools, Git, AI Tooling) with tool name and brief description. The AI Tooling group SHALL include Junie when the repository manages its user-level configuration even though Junie itself is installed separately.

#### Scenario: User scans tool table

- **WHEN** user views the "What's Included" section
- **THEN** they see a categorized table of all managed tools
- **AND** Junie appears under AI Tooling with wording that distinguishes managed configuration from installation

### Requirement: README documents cross-client Linear MCP access

README SHALL describe the official Linear endpoint and summarize the user-level configuration, authentication flow, and credential ownership for Claude Code, OpenCode, and Codex. It SHALL also summarize Junie's credential-free preconfiguration, label Linear access from Junie as not currently supported, and direct readers to revisit the OAuth compatibility check after a future Junie update. It SHALL identify OpenCode's native remote entry and OAuth command and SHALL not imply that a generic Claude server list is automatically shared with the other clients.

#### Scenario: User compares client setup

- **WHEN** a user reads the MCP Servers section
- **THEN** they can identify how Linear is registered and authenticated in Claude Code, OpenCode, and Codex
- **AND** they can identify that Junie is preconfigured but its current OAuth token exchange is unsupported
- **AND** they are directed to the manual for the complete three-client project-listing and issue-creation acceptance check and the Junie revalidation procedure

#### Scenario: README contains no Linear secret

- **WHEN** README is inspected
- **THEN** it contains no real Linear API key, bearer token, OAuth access token, or refresh token

### Requirement: Setup guide

README SHALL document setup in 3 steps: install chezmoi, `chezmoi init pabloimrik17/dotfiles`, `chezmoi apply`. SHALL note that `chezmoi apply` triggers interactive package installation automatically.

#### Scenario: Fresh macOS machine

- **WHEN** user runs the 3 documented commands on a fresh macOS machine with Homebrew
- **THEN** chezmoi clones the repo, prompts for name/email, and runs the install script

### Requirement: Pull and apply workflow

README SHALL document the "catch up" flow with two approaches: quick (`chezmoi update`) and preview-first (`chezmoi git pull -- --autostash --rebase` → `chezmoi diff` → `chezmoi apply`).

#### Scenario: User wants to catch up

- **WHEN** user reads the "Pulling Latest Changes" section
- **THEN** they find both the one-command and the preview-first approaches

### Requirement: Edit and push workflow

README SHALL document the "make changes" flow: editing via `chezmoi edit <file>` or re-syncing with `chezmoi re-add` (non-templates) / `chezmoi add <file>` (templates), then pushing via `chezmoi git add .` → `chezmoi git -- commit -m "msg"` → `chezmoi git push`.

#### Scenario: User edits a non-template file directly

- **WHEN** user modifies a target file (e.g., `~/.gitignore_global`) and reads the workflow
- **THEN** they find `chezmoi re-add` as the sync method

#### Scenario: User edits a template file

- **WHEN** user modifies a `.tmpl` source file and reads the workflow
- **THEN** they find `chezmoi edit` or `chezmoi add` as alternatives since `re-add` doesn't support templates
