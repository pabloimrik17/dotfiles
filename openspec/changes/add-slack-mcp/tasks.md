# Tasks: add-slack-mcp

## 1. Slack workspace prerequisites

- [ ] 1.1 Confirm with a workspace admin that the Slack MCP connector is approved for the workspace; without it every client fails OAuth and the rest of this change is inert
- [ ] 1.2 Create (or reuse) a Slack app with the read scopes the allowlisted tools need per design Migration Plan step 1 (`search:read.public`, `search:read.users`, `channels:history`, `groups:history`, `im:history`, `mpim:history`, `channels:read`, `canvases:read`, `users:read`; add `chat:write` only if message sending is wanted)
- [ ] 1.3 Install the app to the workspace and issue the `xoxp-` user token; verify it with `curl -H "Authorization: Bearer $TOKEN" https://slack.com/api/auth.test`

## 2. Secret plumbing (`zsh-secrets`)

- [ ] 2.1 Create `~/.config/zsh/secrets.zsh` with mode `0600` exporting `SLACK_MCP_TOKEN`, then add it encrypted with `chezmoi add --encrypt ~/.config/zsh/secrets.zsh`; confirm the source file lands as `encrypted_private_dot_config/zsh/secrets.zsh.age`
- [x] 2.2 Add the guarded source line to `dot_zshrc.tmpl` following the existing `[[ -f … ]] && source …` idiom (see the Catppuccin syntax-highlighting line)
- [ ] 2.3 Verify `chezmoi apply` deploys the file at mode `0600`, that a fresh shell exports `SLACK_MCP_TOKEN`, and that removing the deployed file leaves shell startup silent and error-free
- [ ] 2.4 Verify no plaintext token is tracked: `git status --porcelain` is clean of a plaintext `secrets.zsh` and `chezmoi cat` on the source shows the value only after decryption

## 3. Claude Code

- [x] 3.1 Add `slack@claude-plugins-official` to `CC_PLUGINS` in `run_onchange_install-packages.sh.tmpl`, leaving `CC_MARKETPLACES` untouched (`anthropics/claude-plugins-official` is already registered)
- [x] 3.2 Add a comment next to `MCP_HTTP_SERVERS` recording that Slack is intentionally absent (no `registration_endpoint` → no Dynamic Client Registration; the plugin supplies the pre-registered `clientId`)
- [x] 3.3 Add a Slack line to the "Manual Installation Required" section covering OAuth on first use, the required workspace admin approval, and `SLACK_MCP_TOKEN` for OpenCode
- [x] 3.4 Add `"slack@claude-plugins-official": true` to `enabledPlugins` in `dot_claude/settings.json.tmpl`
- [ ] 3.5 Run the install script and confirm the plugin installs, then re-run and confirm it reports "already installed"
- [ ] 3.6 Complete the OAuth flow from `/mcp` and confirm `slack` reports connected; confirm `claude mcp list --scope user` does NOT list it

## 4. Claude Code permissions

- [ ] 4.1 Verify the real tool ids via `/mcp` (or `claude mcp get slack`) once the server is connected; expected form is `mcp__plugin_slack_slack__<tool>`
- [x] 4.2 Add the seven read-only Slack rules to `permissions.allow` in `dot_claude/settings.json.tmpl` (`slack_search_public`, `slack_search_channels`, `slack_search_users`, `slack_read_channel`, `slack_read_thread`, `slack_read_canvas`, `slack_read_user_profile`), keeping `slack_search_public_and_private` and all write tools out
- [ ] 4.3 Verify behaviour: a public search runs without a prompt, while `slack_search_public_and_private` and `slack_send_message` still prompt

## 5. OpenCode

- [x] 5.1 Add the `slack` entry to the `mcp` object in `dot_config/opencode/opencode.jsonc` (`type: "remote"`, `url: "https://mcp.slack.com/mcp"`, `enabled: true`, `oauth: false`, `headers.Authorization: "Bearer {env:SLACK_MCP_TOKEN}"`)
- [ ] 5.2 Apply and validate the rendered file against the declared `$schema`; confirm `model`, `tui`, `plugin`, `formatter`, `permission` and the existing `mcp.expect` entry are unchanged
- [ ] 5.3 Start OpenCode from a shell exporting the token and confirm `slack` connects and lists its tools
- [ ] 5.4 Start OpenCode with `SLACK_MCP_TOKEN` unset and confirm only `slack` fails to connect, with `expect` and the rest of OpenCode unaffected

## 6. Docs

- [x] 6.1 Update `docs/manual.html` via the update-manual skill (Slack MCP in both clients, the OAuth-vs-token split, workspace approval, `SLACK_MCP_TOKEN`, and the new encrypted secrets file)
- [x] 6.2 Update `README.md` via the update-readme skill (What's Included entries for the Slack MCP integration and the zsh secrets mechanism)

## 7. Verification

- [ ] 7.1 Run the install script end-to-end twice and confirm idempotency: the plugin group, the untouched MCP arrays and the manual Slack line all behave on a second run
- [ ] 7.2 Smoke-test Claude Code: search a public channel and read a thread through the Slack tools without a permission prompt
- [ ] 7.3 Smoke-test OpenCode: run one Slack read tool against the same workspace and confirm the bearer token path works
- [x] 7.4 Run `openspec validate add-slack-mcp --strict` and confirm the implementation matches every spec delta before archiving
