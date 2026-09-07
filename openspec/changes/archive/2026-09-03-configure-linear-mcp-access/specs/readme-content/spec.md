## MODIFIED Requirements

### Requirement: What's Included overview

README SHALL contain a table listing managed tools grouped by category (Terminal, Shell, CLI Tools, Git, AI Tooling) with tool name and brief description. The AI Tooling group SHALL include Junie when the repository manages its user-level configuration even though Junie itself is installed separately.

#### Scenario: User scans tool table

- **WHEN** user views the "What's Included" section
- **THEN** they see a categorized table of all managed tools
- **AND** Junie appears under AI Tooling with wording that distinguishes managed configuration from installation

## ADDED Requirements

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
