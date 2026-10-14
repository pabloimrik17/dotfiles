# Spec Delta

## MODIFIED Requirements

### Requirement: OpenCode uses its native remote OAuth transport

The chezmoi-managed OpenCode configuration SHALL define an enabled remote MCP server named `linear` at the official Linear endpoint. Authentication SHALL use OpenCode's native OAuth command and credential store without a local stdio compatibility bridge, package runner, static credential, or managed authentication state.

#### Scenario: OpenCode config is deployed

- **WHEN** `chezmoi apply` deploys `~/.config/opencode/opencode.jsonc`
- **THEN** `mcp.servers.linear` SHALL have type `remote`, set `disabled: false`, and set `url` to `https://mcp.linear.app/mcp`
- **AND** the entry SHALL contain no command array, package coordinate, credential, or static header

#### Scenario: OpenCode authenticates natively

- **WHEN** the user runs `opencode mcp auth linear` without an existing Linear grant
- **THEN** OpenCode SHALL initiate the browser OAuth flow and report the remote server as connected after authorization
- **AND** its generated credential state under `~/.local/share/opencode/mcp-auth.json` SHALL remain outside the dotfiles repository
