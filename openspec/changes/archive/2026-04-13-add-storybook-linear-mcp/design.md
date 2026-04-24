## Context

The install script (`run_onchange_install-packages.sh.tmpl`) already registers 10 global MCP servers in Group 8.5, using two bash arrays: `MCP_STDIO_SERVERS` (7 entries) and `MCP_HTTP_SERVERS` (3 entries). HTTP servers are registered with `claude mcp add --scope user --transport http`. The script has pre-scan, idempotency, and outdated-version handling. At the end of the script there is a manual instructions section that mentions Atlassian and Figma auth.

Both new servers (Linear and Storybook) are HTTP type — they fit directly into the `MCP_HTTP_SERVERS` array without structural changes to the script.

## Goals / Non-Goals

**Goals:**

- Register Linear and Storybook as global HTTP MCP servers via the install script
- Document OAuth auth for Linear and addon requirement for Storybook
- Preserve idempotency and consistency with the existing pattern

**Non-Goals:**

- Do not install the `@storybook/addon-mcp` addon automatically (it's per-project)
- Do not configure Linear auth automatically (requires an interactive browser)
- Do not change the script structure or existing helpers
- Do not pin versions of remote HTTP servers (not applicable — they are fixed URLs, not npm packages)

## Decisions

### Decision 1: Both servers go in `MCP_HTTP_SERVERS`

Linear is a remote server (`https://mcp.linear.app/mcp`). Storybook is a local HTTP server (`http://localhost:6006/mcp`). Both use HTTP transport.

**Rejected alternative**: Register Storybook as stdio with a wrapper. It makes no sense — the Storybook MCP is an HTTP endpoint on the dev server, not a standalone process.

### Decision 2: Storybook at user scope (not per-project)

Registering at user scope means that when Storybook is not running, the server simply fails to connect — no impact. This already happens with the JetBrains MCP (`jetbrains: ✗ Failed to connect`). Avoids having to configure `.mcp.json` in every project.

**Rejected alternative**: Register per-project. It would require repeated configuration and adds nothing — the endpoint is always `localhost:6006/mcp`.

### Decision 3: Linear with OAuth (not API key)

Interactive OAuth is Linear's official method for its MCP server. The token is cached in `~/.mcp-auth` automatically.

**Rejected alternative**: Personal API key via env var. Requires manual token management and is less secure than OAuth with refresh.

### Decision 4: Manual instructions at the end of the script

Add notes for Linear (OAuth) and Storybook (per-project addon) next to the existing Atlassian and Figma notes. Same pattern, same place.

## Risks / Trade-offs

- **[Storybook non-standard port]** → If a project uses a port other than 6006, the MCP does not connect. Mitigation: document in the manual instructions. In practice the default port is rarely changed.
- **[Linear OAuth expires]** → The OAuth token can expire. Mitigation: Linear handles refresh automatically. If it fails, `rm -rf ~/.mcp-auth` and re-authenticate.
- **[Storybook without addon]** → Even if Storybook is running, without `@storybook/addon-mcp` the `/mcp` endpoint does not exist. Mitigation: document clearly in the manual instructions.
