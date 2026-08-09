## Why

The dev environment wires 14 MCP servers across the whole work surface — Linear, Notion and Atlassian for tracking, Figma for design, `gh_grep` for code — but not Slack, which is where most of that context is actually discussed and decided. Agents cannot search a thread, read a channel or post a summary without the user copy-pasting. Slack now ships an official remote MCP server (`https://mcp.slack.com/mcp`) and an official Claude Code plugin published on `anthropics/claude-plugins-official`, a marketplace this repo already registers — so the Claude Code side is a two-line change against machinery that exists.

## What Changes

**Claude Code — via the official plugin**

- Add `slack@claude-plugins-official` to `CC_PLUGINS` in `run_onchange_install-packages.sh.tmpl`. No new marketplace: `anthropics/claude-plugins-official` is already in `CC_MARKETPLACES`.
- Add `"slack@claude-plugins-official": true` to `enabledPlugins` in `dot_claude/settings.json.tmpl`.
- The plugin self-configures the MCP server (`type: http`, `https://mcp.slack.com/mcp`, `oauth.clientId 1601185624273.8899143856786`, `callbackPort 3118`) and prompts for OAuth on first use. It also ships 8 Slack skills (`block-kit`, `slack-api`, `slack-cli`, `slack-messaging`, `slack-search`, `create-slack-app`, …), of which only `slack-search` needs the MCP connection.
- **`slack` is deliberately NOT added to `MCP_HTTP_SERVERS`.** `https://mcp.slack.com/.well-known/oauth-authorization-server` advertises no `registration_endpoint`: Slack does not support Dynamic Client Registration, the only OAuth path `claude mcp add --transport http` knows. Registration would appear to succeed and the server would then fail to authenticate. The plugin is what supplies the pre-registered `clientId` that makes the flow complete.

**OpenCode — remote server plus bearer token**

- Add a `slack` entry to the `mcp` object in `dot_config/opencode/opencode.jsonc`: `type: "remote"`, `url: "https://mcp.slack.com/mcp"`, `oauth: false`, `headers.Authorization: "Bearer {env:SLACK_MCP_TOKEN}"`, `enabled: true`. First `remote`-type server in that file (`expect` is `local`).
- OAuth is switched off on purpose: OpenCode's automatic flow depends on DCR (unavailable), the `clientId`s Slack publishes are bound to Claude's and Cursor's redirect URIs, and Slack's token endpoint advertises only `client_secret_post`, which rules out a public PKCE client too.
- `SLACK_MCP_TOKEN` is a Slack user token (`xoxp-`) from a workspace app holding the approved scopes (`search:read.*`, `channels:history`, `users:read`, `chat:write`, …).

**Secret plumbing**

- New `encrypted_private_dot_config/zsh/secrets.zsh.age` → `~/.config/zsh/secrets.zsh`, sourced from `dot_zshrc.tmpl` when present. Same age convention already behind `encrypted_dot_ticker.yaml.age`; no plaintext token in the repo.
- Graceful degradation: with no token exported, `{env:SLACK_MCP_TOKEN}` resolves empty and OpenCode reports `slack` as failed to connect — the behaviour already accepted for `storybook` — without affecting other servers.

**Permissions and docs**

- Read-only Slack MCP tools (search/read) go into `permissions.allow` in `dot_claude/settings.json.tmpl`; write tools (message posting, canvas and file writes) stay at the default ask level. Exact tool ids are resolved in the specs phase from `claude mcp get slack` once the plugin is loaded.
- The manual-instructions section of the install script gains a Slack line (OAuth on first use, admin approval, `SLACK_MCP_TOKEN` for OpenCode). README "What's Included" and `docs/manual.html` are updated via the `update-readme` / `update-manual` skills as implementation tasks; no spec-level docs changes.

## Capabilities

### New Capabilities

- `zsh-secrets`: age-encrypted environment-secret file deployed by chezmoi and conditionally sourced from `dot_zshrc.tmpl` — the mechanism that puts `SLACK_MCP_TOKEN` (and future tokens) in the shell without committing plaintext, including the no-file and empty-value paths.

### Modified Capabilities

- `claude-code-plugins`: `CC_PLUGINS` and the `enabledPlugins` object gain `slack@claude-plugins-official`; the marketplace list is unchanged.
- `mcp-global-config`: the OpenCode `mcp` object gains a `slack` remote entry, and a new requirement records that Slack is intentionally absent from `MCP_STDIO_SERVERS` / `MCP_HTTP_SERVERS` and from the 13-server table, with the DCR rationale, so a later audit does not "fix" the omission by registering it.
- `claude-user-preferences`: `permissions.allow` gains the read-only Slack MCP tools; write tools stay out, consistent with the existing rule for memory/playwright/chrome-devtools.

## Impact

- **Files**: `run_onchange_install-packages.sh.tmpl`, `dot_claude/settings.json.tmpl`, `dot_config/opencode/opencode.jsonc`, `dot_zshrc.tmpl`, new `encrypted_private_dot_config/zsh/secrets.zsh.age`, `README.md`, `docs/manual.html`.
- **Dependencies**: hosted Slack MCP server (no version to pin, so nothing for Renovate to track, unlike the npx-pinned stdio servers) and the `slack@claude-plugins-official` plugin. Requires Claude Code with plugin support and OpenCode ≥ 1.18 (`oauth` and `{env:…}` support in remote MCP config).
- **Prerequisite outside this repo**: a workspace admin must approve the Slack MCP connector. Without approval OAuth fails for every client and the change is inert — this is a setup note for the manual section, not something the install script can verify.
- **Security**: scope breadth is decided when the Slack app is installed; keep it to the minimum the skills need. The token grants the user's own Slack surface, so the age private key remains the single per-host secret to protect.
- **Non-goals**: community servers (`@slack/mcp-server`, `korotovsky/slack-mcp-server`), bot-token or socket-mode deployments, per-project `.mcp.json` overrides, and the root `opencode.json` of this repo.
