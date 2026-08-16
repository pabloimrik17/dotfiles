## MODIFIED Requirements

### Requirement: Global MCP servers are registered via Claude CLI in install script

`run_onchange_install-packages.sh.tmpl` SHALL register the following 13 MCP servers via `claude mcp add --scope user`, which writes to `~/.claude.json`:

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
| notion          | http  | `https://mcp.notion.com/mcp`                           |
| storybook       | http  | `http://localhost:6006/mcp`                            |

`dot_claude/modify_settings.json.tmpl` SHALL NOT contain an `mcpServers` key.

#### Scenario: All 13 servers registered after install script runs

- **WHEN** `chezmoi apply` runs the install script on a machine with `claude` CLI available
- **AND** the user confirms the MCP servers install group
- **THEN** `claude mcp list --scope user` SHALL list all 13 servers above

#### Scenario: Servers registered to correct file

- **WHEN** a stdio MCP server is registered via the install script
- **THEN** `~/.claude.json` SHALL contain the server under the `mcpServers` key
- **AND** `~/.claude/settings.json` SHALL NOT contain an `mcpServers` key

#### Scenario: Settings template has no mcpServers block

- **WHEN** reading `dot_claude/modify_settings.json.tmpl`
- **THEN** the file SHALL NOT contain an `mcpServers` key at any level

#### Scenario: Stdio servers use pinned versions managed by Renovate

- **WHEN** inspecting registered stdio servers via `claude mcp get <name>`
- **THEN** all 7 stdio servers SHALL reference pinned versions (not `@latest`)
- **AND** `renovate.json` SHALL contain a custom regex manager for the install script template
