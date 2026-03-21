## Context

`dot_claude/settings.json.tmpl` is a chezmoi template that deploys to `~/.claude/settings.json`. It currently contains `env`, `statusLine`, `enabledPlugins`, `extraKnownMarketplaces`, and `effortLevel`. It does not have an `mcpServers` key.

7 MCP servers are identically configured across all project `.mcp.json` files with pinned versions. The goal is to add them as a global `mcpServers` block in the template using `@latest`.

## Goals / Non-Goals

**Goals:**

- Add `mcpServers` to `dot_claude/settings.json.tmpl` with the 7 common servers
- Use `@latest` for all stdio server versions
- Maintain the existing template structure (chezmoi `{{ .chezmoi.homeDir }}` syntax where needed)

**Non-Goals:**

- Migrating atlassian/figma from cloud-managed to local config
- Cleaning up per-project `.mcp.json` files
- Templating MCP config per-machine (plain JSON, no conditional blocks)
- Changing `npx` to `bunx` for MCP server commands

## Decisions

### 1. Add `mcpServers` to existing `settings.json.tmpl` (not a separate `dot_mcp.json`)

Claude Code supports global MCP via `mcpServers` in `~/.claude/settings.json` (scope `user`). Since this file is already chezmoi-managed, adding the key here keeps a single source of truth.

**Alternative considered**: Creating `dot_mcp.json` as a separate chezmoi file deploying to `~/.mcp.json`. Rejected because it introduces a second config file and Claude Code's native user-scope mechanism is `settings.json`.

### 2. Use `@latest` instead of pinned versions

Global config should stay current without manual bumps. Per-project configs can pin if stability matters for CI or reproducibility. Global is a dev-tools context where latest is acceptable.

**Alternative considered**: Keep pinned versions and use Renovate to bump. Rejected as over-engineering for global dev tooling.

### 3. Keep `npx` as the command runner

The current `.mcp.json` files all use `npx`. While the project convention is `bun`, MCP servers are invoked by Claude Code in any directory — `npx` is universally available wherever Node is installed. No machine-specific templating needed.

### 4. No template conditionals

All 7 servers are used on every machine. No need for `{{ if }}` blocks. Plain JSON with only the existing `{{ .chezmoi.homeDir }}` reference in the statusLine command.

## Risks / Trade-offs

- **`@latest` instability** → Mitigated by the fact that these are dev tools, not production dependencies. If a server breaks, per-project `.mcp.json` can pin a known-good version as an override.
- **Duplicate servers** (global + project `.mcp.json`) → Claude Code merges project-level on top of global. Identical entries are harmless; project entries override global if they differ. Per-project cleanup is deferred.
- **chezmoi apply overwrites manual `claude mcp add -s user` changes** → Expected behavior. Chezmoi is the source of truth for global settings. Manual additions should go to project scope or be added to the template.
