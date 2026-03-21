## Why

7 MCP servers (eslint, context7, knip, memory, playwright, chrome-devtools, gh_grep) are duplicated identically across every project's `.mcp.json`. This creates maintenance overhead (updating versions in N places) and means new projects start without MCP support until manually configured. Moving them to Claude Code's global user settings (`~/.claude/settings.json`) via chezmoi eliminates duplication and ensures every machine gets the standard MCP stack on setup.

Relates to: https://github.com/pabloimrik17/dotfiles/issues/75

## What Changes

- Add `mcpServers` key to `dot_claude/settings.json.tmpl` with the 7 common MCP servers using `@latest` versions
- Atlassian and Figma remain cloud-managed (`claude.ai`) — not included in local config
- Per-project `.mcp.json` files are left untouched (cleanup is a separate future task)

## Capabilities

### New Capabilities

- `mcp-global-config`: Global MCP server definitions deployed to `~/.claude/settings.json` via chezmoi, providing eslint, context7, knip, memory, playwright, chrome-devtools, and gh_grep to all Claude Code sessions without per-project configuration

### Modified Capabilities

_None — this adds a new section to `settings.json.tmpl` without changing existing capabilities._

## Impact

- **File**: `dot_claude/settings.json.tmpl` — new `mcpServers` key added
- **Deploy target**: `~/.claude/settings.json` on all chezmoi-managed machines
- **Versioning shift**: Pinned versions (`@0.3.0`, `@2.1.2`, etc.) → `@latest` for global config
- **No breaking changes**: Per-project `.mcp.json` continues to work and can override/extend global servers
