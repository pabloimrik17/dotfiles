## MODIFIED Requirements

### Requirement: Global MCP servers are registered via Claude CLI in install script

`run_onchange_install-packages.sh.tmpl` SHALL register the following 12 MCP servers via `claude mcp add --scope user`, which writes to `~/.claude.json`:

| Name            | Type  | Command/URL                                            |
| --------------- | ----- | ------------------------------------------------------ |
| eslint          | stdio | `npx -y @eslint/mcp@0.3.0`                             |
| context7        | stdio | `npx -y @upstash/context7-mcp@2.1.2`                   |
| knip            | stdio | `npx -y @knip/mcp@0.0.19`                              |
| memory          | stdio | `npx -y @modelcontextprotocol/server-memory@2026.1.26` |
| playwright      | stdio | `npx -y @playwright/mcp@0.0.68`                        |
| chrome-devtools | stdio | `npx -y chrome-devtools-mcp@0.18.1`                    |
| expect          | stdio | `npx -y expect-cli@0.1.3 mcp`                          |
| gh_grep         | http  | `https://mcp.grep.app`                                 |
| atlassian       | http  | `https://mcp.atlassian.com/v1/mcp`                     |
| figma           | http  | `https://mcp.figma.com/mcp`                            |
| linear          | http  | `https://mcp.linear.app/mcp`                           |
| storybook       | http  | `http://localhost:6006/mcp`                            |

`dot_claude/settings.json.tmpl` SHALL NOT contain an `mcpServers` key.

#### Scenario: All 12 servers registered after install script runs

- **WHEN** `chezmoi apply` runs the install script on a machine with `claude` CLI available
- **AND** the user confirms the MCP servers install group
- **THEN** `claude mcp list --scope user` SHALL list all 12 servers above

#### Scenario: Servers registered to correct file

- **WHEN** a stdio MCP server is registered via the install script
- **THEN** `~/.claude.json` SHALL contain the server under the `mcpServers` key
- **AND** `~/.claude/settings.json` SHALL NOT contain an `mcpServers` key

#### Scenario: Settings template has no mcpServers block

- **WHEN** reading `dot_claude/settings.json.tmpl`
- **THEN** the file SHALL NOT contain an `mcpServers` key at any level

#### Scenario: Stdio servers use pinned versions managed by Renovate

- **WHEN** inspecting registered stdio servers via `claude mcp get <name>`
- **THEN** all 7 stdio servers SHALL reference pinned versions (not `@latest`)
- **AND** `renovate.json` SHALL contain a custom regex manager for the install script template

### Requirement: Atlassian, Figma, Linear, and Storybook included as HTTP servers with auth/setup notes

The install script SHALL register `atlassian`, `figma`, `linear`, and `storybook` as HTTP MCP servers. The manual instructions section SHALL note authentication and setup requirements for each.

#### Scenario: HTTP servers registered with correct transport

- **WHEN** the install script registers `atlassian`, `figma`, `linear`, and `storybook`
- **THEN** it SHALL use `claude mcp add --scope user --transport http <name> <url>`

#### Scenario: Manual auth instructions printed for OAuth servers

- **WHEN** the install script reaches the manual instructions section
- **THEN** it SHALL include a line noting that `atlassian`, `figma`, and `linear` MCP servers require OAuth authentication via `/mcp` or first use

#### Scenario: Manual setup instructions printed for Storybook

- **WHEN** the install script reaches the manual instructions section
- **THEN** it SHALL include a line noting that `storybook` MCP requires `@storybook/addon-mcp` installed in each Storybook project and `storybook dev` running on port 6006

#### Scenario: Storybook gracefully fails when not running

- **WHEN** `storybook dev` is NOT running on localhost:6006
- **THEN** `claude mcp list` SHALL show `storybook` as failed to connect
- **AND** no error SHALL affect other MCP server connections
