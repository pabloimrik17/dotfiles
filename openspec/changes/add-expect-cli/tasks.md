## 1. Claude Code MCP Registration

- [ ] 1.1 Add `expect` entry to `mcpServers` in `dot_claude/settings.json.tmpl` with command `npx` and args `["-y", "expect-cli@latest", "mcp"]`

## 2. OpenCode MCP Registration

- [ ] 2.1 Add `mcp` section to `dot_config/opencode/opencode.jsonc` with `expect` entry of type `local`, command `["npx", "-y", "expect-cli@latest", "mcp"]`, and `enabled: true`

## 3. Spec Update

- [ ] 3.1 Update `openspec/specs/mcp-global-config/spec.md` to reflect 10 servers (was 9) and include expect in the server table
