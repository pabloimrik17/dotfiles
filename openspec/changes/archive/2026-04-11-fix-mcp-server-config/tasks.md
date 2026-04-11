## 1. Remove dead MCP config from settings template

- [x] 1.1 Remove the `mcpServers` section from `dot_claude/settings.json.tmpl` (the trailing comma on `permissions` closing brace must also be fixed to keep valid JSON)

## 2. Add MCP registration group to install script

- [x] 2.1 Add MCP server arrays (stdio + http) to `run_onchange_install-packages.sh.tmpl` as a new group between CC plugins (Group 8) and Agent skills (Group 9)
- [x] 2.2 Implement pre-scan by reading `~/.claude.json` directly to count already-registered and outdated servers (`claude mcp list` has no `--json` or `--scope` flags)
- [x] 2.3 Add `confirm` prompt and registration loop: stdio servers via `claude mcp add --scope user NAME -- COMMAND ARGS`, http servers via `claude mcp add --scope user --transport http NAME URL`
- [x] 2.4 Use `run_claude_step` wrapper for each `claude mcp add` call; skip up-to-date servers, re-register outdated ones via `claude mcp remove` + `claude mcp add`

## 3. Update manual instructions

- [x] 3.1 Add a line to the manual instructions section noting atlassian and figma MCP servers require OAuth authentication

## 4. Cleanup

- [x] 4.1 Delete the stale `feature/chezmoi-mcp-global-config-proposal` branch (local and remote)
