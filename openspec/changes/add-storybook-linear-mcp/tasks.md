## 1. Install script — add servers to arrays

- [x] 1.1 Add `"linear:https://mcp.linear.app/mcp"` to `MCP_HTTP_SERVERS` array in `run_onchange_install-packages.sh.tmpl`
- [x] 1.2 Add `"storybook:http://localhost:6006/mcp"` to `MCP_HTTP_SERVERS` array in `run_onchange_install-packages.sh.tmpl`

## 2. Install script — update manual instructions

- [x] 2.1 Add Linear OAuth auth note alongside existing Atlassian/Figma notes in the manual instructions section
- [x] 2.2 Add Storybook setup note explaining `@storybook/addon-mcp` addon requirement and port 6006

## 3. Verification

- [x] 3.1 Run `chezmoi diff` to verify only expected files changed
- [x] 3.2 Run `chezmoi execute-template` to confirm template renders correctly
- [ ] 3.3 Verify `claude mcp list` shows linear and storybook after registration (requires actual `chezmoi apply`)
