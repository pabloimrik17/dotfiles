## ADDED Requirements

### Requirement: Global MCP servers are defined in chezmoi settings template

`dot_claude/settings.json.tmpl` SHALL contain an `mcpServers` key with the following 7 servers:

| Name            | Type  | Command/URL                                         |
| --------------- | ----- | --------------------------------------------------- |
| eslint          | stdio | `npx -y @eslint/mcp@latest`                         |
| context7        | stdio | `npx -y @upstash/context7-mcp@latest`               |
| knip            | stdio | `npx -y @knip/mcp@latest`                           |
| memory          | stdio | `npx -y @modelcontextprotocol/server-memory@latest` |
| playwright      | stdio | `npx -y @playwright/mcp@latest`                     |
| chrome-devtools | stdio | `npx -y chrome-devtools-mcp@latest`                 |
| gh_grep         | http  | `https://mcp.grep.app`                              |

#### Scenario: All 7 servers present after chezmoi apply

- **WHEN** `chezmoi apply` is run on a new machine
- **THEN** `~/.claude/settings.json` SHALL contain an `mcpServers` object with exactly the 7 servers listed above

#### Scenario: Stdio servers use @latest versions

- **WHEN** inspecting the deployed `~/.claude/settings.json`
- **THEN** all 6 stdio servers SHALL reference `@latest` (not pinned versions)

#### Scenario: Existing settings keys are preserved

- **WHEN** `chezmoi apply` deploys the updated template
- **THEN** the `env`, `statusLine`, `enabledPlugins`, `extraKnownMarketplaces`, and `effortLevel` keys SHALL remain unchanged

### Requirement: Global config does not include cloud-managed servers

The `mcpServers` key in `dot_claude/settings.json.tmpl` SHALL NOT include `atlassian` or `figma` servers. These are managed via `claude.ai` cloud configuration and their presence/absence varies by machine.

#### Scenario: Atlassian and Figma absent from global config

- **WHEN** inspecting the deployed `~/.claude/settings.json`
- **THEN** the `mcpServers` object SHALL NOT contain keys `atlassian` or `figma`

### Requirement: Template uses no machine-specific conditionals for MCP

The `mcpServers` block SHALL be plain JSON without chezmoi template conditionals (`{{ if }}`, `{{ else }}`). All 7 servers are deployed identically to every machine.

#### Scenario: No conditional logic in mcpServers block

- **WHEN** reading `dot_claude/settings.json.tmpl`
- **THEN** the `mcpServers` section SHALL contain no chezmoi template directives (`{{ ... }}` tokens of any kind)
