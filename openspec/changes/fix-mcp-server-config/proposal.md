## Why

Claude Code reads user-level MCP servers from `~/.claude.json`, not from `~/.claude/settings.json`. The 10 MCP servers added to `dot_claude/settings.json.tmpl` in PR #85 were never actually loaded by Claude Code — they existed in config but had zero effect. This was confirmed via `claude mcp get` returning "No MCP server found" for servers defined only in `settings.json`.

## What Changes

- **Remove** the `mcpServers` section from `dot_claude/settings.json.tmpl` — Claude Code does not read MCP config from this file
- **Add** a new install group to `run_onchange_install-packages.sh.tmpl` that registers all 10 MCP servers via `claude mcp add --scope user`, which writes to the correct file (`~/.claude.json`)
- **Update** the `mcp-global-config` spec to reflect the correct configuration mechanism (CLI-based registration, not template-based)
- **Clean up** the stale `feature/chezmoi-mcp-global-config-proposal` branch
- **Add** manual instructions noting that `atlassian` and `figma` require interactive OAuth authentication after registration

## Capabilities

### New Capabilities

_(none — this is a fix to an existing capability)_

### Modified Capabilities

- `mcp-global-config`: Requirements change from "MCPs defined in chezmoi settings template" to "MCPs registered via `claude mcp add` in the install script". The target file changes from `~/.claude/settings.json` to `~/.claude.json`, and the mechanism changes from declarative template to imperative CLI commands.

## Impact

- **`dot_claude/settings.json.tmpl`**: Remove ~50 lines (the `mcpServers` block). No other keys affected.
- **`run_onchange_install-packages.sh.tmpl`**: New group (~60 lines) between CC plugins (Group 8) and Agent skills (Group 9). Uses existing `run_claude_step` helper and `confirm` pattern.
- **`~/.claude.json`**: Now the source of truth for user-level MCP servers. Not managed by chezmoi (contains runtime state). Servers are registered imperatively.
- **Existing MCP servers already in `~/.claude.json`**: No disruption — `claude mcp add --scope user` is idempotent (overwrites if exists).
- **`feature/chezmoi-mcp-global-config-proposal` branch**: To be deleted (superseded by this approach).
