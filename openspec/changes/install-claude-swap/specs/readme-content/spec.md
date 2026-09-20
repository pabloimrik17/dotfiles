## MODIFIED Requirements

### Requirement: What's Included overview

README SHALL contain a table listing managed tools grouped by category (Terminal, Shell, CLI Tools, Git, AI Tooling) with tool name and brief description. The AI Tooling group SHALL include Junie when the repository manages its user-level configuration even though Junie itself is installed separately. It SHALL include `claude-swap` as the macOS account/quota manager for Claude Code and SHALL distinguish it from Claude Code itself.

#### Scenario: User scans tool table

- **WHEN** user views the "What's Included" section
- **THEN** they see a categorized table of all managed tools
- **AND** Junie appears under AI Tooling with wording that distinguishes managed configuration from installation
- **AND** claude-swap appears under AI Tooling with wording that identifies its pinned macOS account-switching role

### Requirement: Setup guide

README SHALL document setup in 3 steps: install chezmoi, `chezmoi init pabloimrik17/dotfiles`, `chezmoi apply`. It SHALL note that initialization prompts for name, email, and a required no-default `personal`/`work` machine type, and that `chezmoi apply` triggers interactive package installation automatically. It SHALL summarize the optional first-run claude-swap enrollment offer and point to the manual for the complete account, menu-toggle, validation, and recovery workflow.

#### Scenario: Fresh macOS machine

- **WHEN** user runs the 3 documented commands on a fresh macOS machine with Homebrew
- **THEN** chezmoi clones the repo, prompts for name, email, and machine type, and runs the install script
- **AND** an incomplete claude-swap account setup can be started from the interactive post-install offer or the documented re-runnable command

#### Scenario: Reader understands setup boundaries

- **WHEN** a user reads the setup section before enrolling Claude accounts
- **THEN** the README identifies Keychain/runtime credential ownership and the manual-toggle step without exposing or asking them to commit a token

