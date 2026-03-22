## 1. Add mcpServers to settings template

- [x] 1.1 Add `mcpServers` key to `dot_claude/settings.json.tmpl` with 9 servers (eslint, context7, knip, memory, playwright, chrome-devtools, gh_grep, atlassian, figma)
- [x] 1.2 Verify the template produces valid JSON with `chezmoi cat ~/.claude/settings.json | jq -e . >/dev/null`

## 2. Validate deployment

- [x] 2.1 Run `chezmoi diff` and confirm only the `mcpServers` addition appears
- [ ] 2.2 Run `chezmoi apply` and verify `~/.claude/settings.json` contains the new `mcpServers` block
- [ ] 2.3 Run `claude mcp list` and confirm all 9 global servers appear and connect
