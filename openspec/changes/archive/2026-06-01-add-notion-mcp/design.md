## Context

The install script (`run_onchange_install-packages.sh.tmpl`) registers 12 global MCP servers in Group 8.5 via two bash arrays: `MCP_STDIO_SERVERS` (7 entries) and `MCP_HTTP_SERVERS` (5 entries). HTTP servers are added with `claude mcp add --scope user --transport http`. The group already has pre-scan, idempotency, and outdated-config handling. The manual-instructions section near the end notes OAuth auth for Atlassian, Figma, and Linear.

Notion's hosted MCP server (`https://mcp.notion.com/mcp`) is HTTP transport with a one-click OAuth flow on first use — structurally identical to the Linear entry. It fits directly into `MCP_HTTP_SERVERS` with no structural change to the script.

## Goals / Non-Goals

**Goals:**

- Register Notion as a global HTTP MCP server via the install script (12 → 13 servers).
- Document Notion's OAuth requirement alongside the existing Atlassian/Figma/Linear note.
- Preserve idempotency and consistency with the existing HTTP pattern.

**Non-Goals:**

- Do not use the self-hosted open-source `@notionhq/notion-mcp-server` (stdio) — the hosted endpoint needs no token management.
- Do not store or template a Notion integration token (OAuth replaces it).
- Do not change the script structure, helpers, or other servers.
- Do not add Notion to the OpenCode global config (`dot_config/opencode/opencode.jsonc` only carries `expect`; the HTTP servers live only in the Claude install script — same as Linear).

## Decisions

### Decision 1: Hosted endpoint, not the self-hosted stdio package

Use `https://mcp.notion.com/mcp` (HTTP). It is Notion's recommended, actively maintained server; auth is OAuth with automatic refresh, so there is nothing to pin or rotate.

**Rejected alternative**: `npx @notionhq/notion-mcp-server` (stdio) with `NOTION_TOKEN`. Requires creating an internal integration, storing a secret, and pinning a package version via Renovate. More moving parts for no benefit on a personal multi-machine setup.

### Decision 2: Notion goes in `MCP_HTTP_SERVERS`, ordered before `storybook`

Insert `notion:https://mcp.notion.com/mcp` after `linear` and before `storybook`, grouping the remote OAuth servers together and keeping the local `storybook` entry last. Matches the spec table order.

### Decision 3: OAuth on first use (not an API key)

The hosted server authenticates via a one-click OAuth flow; the token is cached under `~/.mcp-auth`. No env var, no template secret.

**Rejected alternative**: Internal-integration token via env var — manual management, less secure, redundant with OAuth.

### Decision 4: Manual instructions next to the existing OAuth note

Extend the existing OAuth manual-instructions line (currently Atlassian/Figma/Linear) to include Notion, or add a parallel line. Same pattern, same place — no new section.

## Risks / Trade-offs

- **[Notion OAuth expires]** → Token can expire. Mitigation: the hosted server refreshes automatically; if it fails, `rm -rf ~/.mcp-auth` and re-authenticate via `/mcp`.
- **[Endpoint/URL changes upstream]** → A fixed URL could change. Mitigation: same exposure as the other HTTP servers; `mcp_config_matches` detects a URL change and re-registers on the next `chezmoi apply`.
- **[OAuth needs a browser on first use]** → Headless machines can't complete the flow at install time. Mitigation: registration is non-fatal; auth happens lazily on first invocation, documented in the manual note.

## Migration Plan

1. Add the `notion` entry to `MCP_HTTP_SERVERS` and the OAuth manual note.
2. `chezmoi apply` → confirm the MCP group → script registers `notion` (pre-scan reports 1 new).
3. Authenticate on first Notion tool use (or via `/mcp`).
4. **Rollback**: remove the array entry and run `claude mcp remove notion -s user`.
