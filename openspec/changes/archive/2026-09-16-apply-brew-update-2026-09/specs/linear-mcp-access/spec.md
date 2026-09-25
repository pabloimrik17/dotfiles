## MODIFIED Requirements

### Requirement: Junie configuration is prepared while Linear OAuth remains unsupported

Chezmoi SHALL merge a `linear` remote server at the official endpoint into Junie's user-scope MCP file at `~/.junie/mcp/mcp.json`. The Linear portion of the merge SHALL own only `mcpServers.linear`, preserve all other valid existing configuration except entries managed by separate capabilities, and fail closed without replacing the target with empty or malformed content. The resulting file SHALL contain no API key, bearer token, or static Authorization header. Documentation and parity records SHALL mark Junie as not currently supported because its OAuth token exchange with Linear fails, and SHALL retain the credential-free entry for revalidation with a future Junie release.

#### Scenario: Junie config is deployed

- **WHEN** `chezmoi apply` runs on a machine without Junie MCP configuration
- **THEN** `~/.junie/mcp/mcp.json` SHALL contain `mcpServers.linear.url` equal to `https://mcp.linear.app/mcp`

#### Scenario: Existing Junie servers survive apply

- **WHEN** `~/.junie/mcp/mcp.json` contains valid non-Linear MCP server entries and `chezmoi apply` runs
- **THEN** those entries SHALL remain unchanged while `mcpServers.linear` converges to the managed endpoint

#### Scenario: Junie merge cannot produce valid JSON

- **WHEN** the merge engine is unavailable or cannot produce valid JSON
- **THEN** an unavailable engine SHALL leave the live Junie MCP file unchanged, or a valid empty object SHALL be emitted when no live file exists
- **AND** an engine that runs but cannot produce valid JSON SHALL make the merge exit non-zero with nothing on standard output and name `~/.junie/mcp/mcp.json` on standard error
- **AND** chezmoi SHALL NOT replace it with empty or malformed content

#### Scenario: Junie OAuth limitation is recorded safely

- **WHEN** the user opens `/mcp`, selects the user-scope `linear` server, and chooses Authorize
- **THEN** the current compatibility record SHALL report the reproduced `400 Bad Request` response with `Client must not use multiple authentication methods`
- **AND** Junie SHALL be labelled as not currently supported rather than Active or connected
- **AND** documentation SHALL direct a future Junie release to repeat the controlled OAuth check before enabling functional acceptance
- **AND** documentation SHALL NOT recommend a static token, Authorization header, compatibility bridge, or other credential workaround
- **AND** the managed JSON file SHALL remain free of credentials
