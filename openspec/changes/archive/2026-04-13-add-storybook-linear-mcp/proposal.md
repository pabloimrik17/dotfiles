## Why

The current setup has 10 global MCP servers but lacks integration with Linear (issue/project management) and Storybook (component documentation and testing). Linear is a remote service that works from any repo; Storybook is a local HTTP server that activates only when `storybook dev` is running — both fit as user-scope global servers.

## What Changes

- Register the **Linear** MCP server (`https://mcp.linear.app/mcp`) as a global HTTP server with interactive OAuth authentication
- Register the **Storybook** MCP server (`http://localhost:6006/mcp`) as a global HTTP server — available only when a project has Storybook running (fails silently otherwise, same as the JetBrains MCP)
- Update the install script to register 12 servers instead of 10
- Document that Linear requires post-registration OAuth and that Storybook requires the `@storybook/addon-mcp` addon per project

## Capabilities

### New Capabilities

_(none — no new capability is introduced)_

### Modified Capabilities

- `mcp-global-config`: 2 HTTP servers are added to the global servers table (Linear and Storybook), going from 10 to 12 registered servers. Count scenarios and manual auth instructions are updated.

## Impact

- **Install script** (`run_onchange_install-packages.sh.tmpl`): MCP server arrays grow by 2 additional HTTP entries
- **Spec `mcp-global-config`**: server table and count scenarios must be updated
- **Manual/README**: document auth requirements (Linear OAuth) and per-project addon (Storybook)
- **No breaking changes**: existing servers are not modified
