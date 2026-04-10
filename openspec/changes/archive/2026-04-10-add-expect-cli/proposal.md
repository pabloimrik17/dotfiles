## Why

The dotfiles already provide AI agents with browser automation via the Playwright MCP server, but that only gives raw browser control — the agent has to decide what to test and how. [expect-cli](https://github.com/millionco/expect) fills a different niche: it scans git diffs, generates a test plan via AI, and executes it in a real browser with Playwright, reusing actual login sessions from Chrome/Firefox/Safari. It's purpose-built for "did my code change break anything?" without writing test files.

Registering the expect MCP server globally means every Claude Code and OpenCode session has access to browser-based verification out of the box. The per-project skill (`expect init`) remains a manual step since it installs project-local files (SKILL.md, preferences) that don't belong in a global dotfiles repo.

GitHub issue: pabloimrik17/dotfiles#94

## What Changes

- Register `expect` as a global MCP server in Claude Code settings (`dot_claude/settings.json.tmpl`) using `npx -y expect-cli@latest mcp`
- Register `expect` as a global MCP server in OpenCode config (`dot_config/opencode/opencode.jsonc`) using the OpenCode MCP format
- Update the `mcp-global-config` capability spec to reflect the new server count (9 -> 10)

No install script changes — expect-cli runs via `npx` on demand, matching the pattern of every other MCP server in the dotfiles. No shell aliases, no config files, no chezmoi templates beyond the two config edits.

## Capabilities

### Modified Capabilities

- `mcp-global-config`: Add expect MCP server entry to the global server list (10 servers total)

### New Capabilities

_None — this is adding a server to the existing global MCP config infrastructure._

## Impact

- **Files modified**: `dot_claude/settings.json.tmpl` (add expect to mcpServers), `dot_config/opencode/opencode.jsonc` (add expect to mcp section), `openspec/specs/mcp-global-config/spec.md` (update server count and table)
- **Dependencies**: Node.js/npx (already available — used by 6 other MCP servers)
- **No new config files** — expect uses npx on-the-fly, no global state
- **No breaking changes** to existing configuration
- **Per-project setup** (`npx -y expect-cli@latest init`) remains the user's responsibility and is not automated by the dotfiles
