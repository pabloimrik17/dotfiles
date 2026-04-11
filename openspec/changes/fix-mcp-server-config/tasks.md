## 1. Remove dead MCP config from settings template

- [ ] 1.1 Remove the `mcpServers` section from `dot_claude/settings.json.tmpl` (the trailing comma on `permissions` closing brace must also be fixed to keep valid JSON)

## 2. Add MCP registration group to install script

- [ ] 2.1 Add MCP server arrays (stdio + http) to `run_onchange_install-packages.sh.tmpl` as a new group between CC plugins (Group 8) and Agent skills (Group 9)
- [ ] 2.2 Implement pre-scan using `claude mcp list --json --scope user` to count already-registered servers
- [ ] 2.3 Add `confirm` prompt and registration loop: stdio servers via `claude mcp add --scope user NAME -- COMMAND ARGS`, http servers via `claude mcp add --scope user --transport http NAME URL`
- [ ] 2.4 Use `run_claude_step` wrapper for each `claude mcp add` call and skip already-registered servers

## 3. Update manual instructions

- [ ] 3.1 Add a line to the manual instructions section noting atlassian and figma MCP servers require OAuth authentication

## 4. Cleanup

- [ ] 4.1 Delete the stale `feature/chezmoi-mcp-global-config-proposal` branch (local and remote)
