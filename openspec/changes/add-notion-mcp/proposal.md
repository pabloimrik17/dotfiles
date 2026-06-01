## Why

The global MCP setup has 12 servers but no Notion integration. Notion now ships a hosted, OAuth-based MCP server (`https://mcp.notion.com/mcp`), so connecting it is as low-maintenance as Linear, Atlassian, and Figma — a single HTTP entry that authenticates on first use, with no token to store or rotate.

## What Changes

- Register the **Notion** MCP server (`https://mcp.notion.com/mcp`) as a global HTTP server with interactive OAuth authentication (one-click flow on first use).
- Update the install script to register 13 servers instead of 12.
- Document that Notion requires post-registration OAuth, alongside the existing Atlassian/Figma/Linear note.

## Capabilities

### New Capabilities

_(none — no new capability is introduced)_

### Modified Capabilities

- `mcp-global-config`: 1 HTTP server is added to the global servers table (Notion), going from 12 to 13 registered servers. Count scenarios and manual auth instructions are updated.

## Impact

- **Install script** (`run_onchange_install-packages.sh.tmpl`): `MCP_HTTP_SERVERS` array grows by 1 entry; the manual-instructions section grows by 1 OAuth note.
- **Spec `mcp-global-config`**: server table, count scenarios, and the OAuth-servers manual scenario must be updated.
- **Docs** (`README.md`, `docs/manual.html`): Notion added to the MCP server listing with its OAuth note.
- **No breaking changes**: existing servers are not modified; the entry uses the same HTTP/OAuth pattern already proven by Linear.
