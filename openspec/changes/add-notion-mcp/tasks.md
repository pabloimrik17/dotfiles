## 1. Install script — add server to array

- [x] 1.1 Add `"notion:https://mcp.notion.com/mcp"` to `MCP_HTTP_SERVERS` in `run_onchange_install-packages.sh.tmpl`, ordered after `linear` and before `storybook`

## 2. Install script — update manual instructions

- [x] 2.1 Extend the OAuth manual-instructions line so it also notes that `notion` requires OAuth authentication via `/mcp` or first use (alongside Atlassian/Figma/Linear)

## 3. Docs

- [x] 3.1 Add Notion (with its OAuth note) to the MCP server listing in `README.md` (added a new "MCP Servers" section listing all 13 servers)
- [x] 3.2 Add Notion (with its OAuth note) to the MCP server section of `docs/manual.html` (backfilled all HTTP servers + `expect`; added an Auth/setup column)

## 4. Verification

- [x] 4.1 Run `chezmoi execute-template` against the install script to confirm it renders without errors
- [x] 4.2 Run `chezmoi diff` to verify only expected files changed
- [ ] 4.3 After `chezmoi apply`, verify `claude mcp list --scope user` shows `notion` (13 servers total) and authenticate on first use — deferred: needs the branch merged + `chezmoi update` to sync the installed source (`~/.local/share/chezmoi`)
