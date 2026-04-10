## MODIFIED Requirements

### Requirement: Global MCP servers are defined in chezmoi settings template

`dot_claude/settings.json.tmpl` SHALL contain an `mcpServers` key with the following 10 servers:

| Name            | Type  | Command/URL                                         |
| --------------- | ----- | --------------------------------------------------- |
| eslint          | stdio | `npx -y @eslint/mcp@latest`                         |
| context7        | stdio | `npx -y @upstash/context7-mcp@latest`               |
| knip            | stdio | `npx -y @knip/mcp@latest`                           |
| memory          | stdio | `npx -y @modelcontextprotocol/server-memory@latest` |
| playwright      | stdio | `npx -y @playwright/mcp@latest`                     |
| chrome-devtools | stdio | `npx -y chrome-devtools-mcp@latest`                 |
| expect          | stdio | `npx -y expect-cli@latest mcp`                      |
| gh_grep         | http  | `https://mcp.grep.app`                              |
| atlassian       | http  | `https://mcp.atlassian.com/v1/mcp`                  |
| figma           | http  | `https://mcp.figma.com/mcp`                         |

#### Scenario: All 10 servers present after chezmoi apply

- **WHEN** `chezmoi apply` is run on a new machine
- **THEN** `~/.claude/settings.json` SHALL contain an `mcpServers` object with exactly the 10 servers listed above

#### Scenario: Expect server uses npx with @latest tag

- **WHEN** inspecting the deployed `~/.claude/settings.json`
- **THEN** the `expect` MCP server entry SHALL have command `npx` and args `["-y", "expect-cli@latest", "mcp"]`

## ADDED Requirements

### Requirement: Expect MCP server is registered globally in OpenCode config

`dot_config/opencode/opencode.jsonc` SHALL contain an `mcp` key with an `expect` server entry using the OpenCode local MCP format.

#### Scenario: Expect MCP server present in OpenCode config after chezmoi apply

- **WHEN** `chezmoi apply` is run on a new machine
- **THEN** `~/.config/opencode/opencode.jsonc` SHALL contain an `mcp` object with an `expect` entry of type `"local"`, command `["npx", "-y", "expect-cli@latest", "mcp"]`, and `enabled: true`

#### Scenario: OpenCode MCP section does not affect existing config keys

- **WHEN** `chezmoi apply` deploys the updated OpenCode config
- **THEN** the `model`, `tui`, `plugin`, `formatter`, and `permission` keys SHALL remain unchanged
