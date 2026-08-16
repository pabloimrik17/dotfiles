# Design: add-slack-mcp

## Context

See proposal.md — Why. The constraint that shapes everything here is Slack's OAuth metadata, verified against the live endpoint:

```
GET https://mcp.slack.com/.well-known/oauth-authorization-server
  issuer                              https://mcp.slack.com
  authorization_endpoint              https://slack.com/oauth/v2_user/authorize
  token_endpoint                      https://slack.com/api/oauth.v2.user.access
  grant_types_supported               authorization_code, refresh_token
  token_endpoint_auth_methods_supported   client_secret_post
  code_challenge_methods_supported    S256
  registration_endpoint               (absent)
```

Three facts follow, and every decision below is downstream of them:

1. **No `registration_endpoint`** → no Dynamic Client Registration (RFC 7591). Any client that expects to mint its own `clientId` on the fly cannot talk to this server.
2. **`client_secret_post` is the only token-endpoint auth method** → even with PKCE (`S256` is offered), the token exchange carries a client secret. There is no purely public client path.
3. **Slack ships pre-registered `clientId`s to specific vendors.** The official Claude Code plugin (`slackapi/slack-mcp-plugin`, vendored through `anthropics/claude-plugins-official`) carries `clientId 1601185624273.8899143856786` with `callbackPort 3118` in its `.mcp.json`; its plugin id is `slack` and its MCP server key is `slack`, which fixes the Claude tool namespace at `mcp__plugin_slack_slack__*`.

Existing machinery this change rides on: `CC_MARKETPLACES`/`CC_PLUGINS` arrays and the `run_claude_step` PTY wrapper in `run_onchange_install-packages.sh.tmpl`; `enabledPlugins` and `permissions.allow` in `dot_claude/settings.json.tmpl`; the `mcp` object in `dot_config/opencode/opencode.jsonc` (today a single `local` server, `expect`); age encryption already proven by `encrypted_dot_ticker.yaml.age`. Versions on this host: Claude Code 2.1.222, OpenCode 1.18.11.

## Goals / Non-Goals

**Goals:**

- One Slack integration reachable from both agents, each through the authentication path its client actually supports.
- Zero secret material in the repository, and no secret in any file chezmoi renders as plaintext.
- Failure isolation: an unapproved workspace, a missing token or a revoked plugin degrades to "Slack unavailable", never to a broken shell, a failed `chezmoi apply`, or a broken MCP server list.

**Non-Goals:**

- Symmetry between the two clients. Claude Code gets OAuth-through-plugin, OpenCode gets a bearer token; forcing one mechanism on both is what this design deliberately avoids.
- Automating the workspace-admin approval or the Slack app creation — both live outside the repo, and both are one-time.
- Scope minimisation logic in code. Which scopes the token carries is decided once, when the Slack app is installed; nothing in the dotfiles can enforce it.

## Decisions

### D1: Claude Code gets Slack from the official plugin, not from `claude mcp add --transport http`

`claude mcp add --scope user --transport http slack https://mcp.slack.com/mcp` is the shape every other HTTP server in this repo uses (`atlassian`, `figma`, `linear`, `notion`), and it is the wrong tool here. That path has no field for a `clientId`; it discovers one via DCR, which fact (1) rules out. The registration would succeed, `~/.claude.json` would gain a `slack` entry, and every tool call would fail authentication — the worst failure mode available, because it looks configured.

The plugin instead ships the pre-registered `clientId` in its own `.mcp.json`, and Claude Code performs the authorization-code flow against `slack.com/oauth/v2_user/authorize` with the callback on port 3118. Consequence: `slack` appears in `/mcp` but never in `claude mcp list --scope user`, which is why the spec pins that asymmetry down explicitly — otherwise a later audit of "integrations vs. registered MCP servers" reads it as an omission and re-adds it.

Alternative considered: registering the HTTP server *and* letting the plugin's OAuth credentials cover it. They are separate configuration namespaces in Claude Code; the plugin's `clientId` does not apply to a user-scope server of the same name. Rejected.

### D2: OpenCode gets a bearer token, with `oauth: false` set explicitly

OpenCode's `McpRemoteConfig` does support a static OAuth client — `oauth: { clientId, clientSecret, scope, callbackPort, redirectUri }` — so the naive reading ("OpenCode needs DCR, therefore OAuth is impossible") is wrong and worth correcting here. Three concrete paths existed:

- **Reuse the Claude plugin's `clientId`.** Requires our redirect URI to be one Slack registered for Anthropic's client. Borrowed credentials, unilaterally revocable, and a support burden nobody signed up for. Rejected.
- **Register our own Slack app and configure `oauth.clientId` + `oauth.clientSecret`.** Legitimate, but fact (2) means the token exchange needs the client secret, and `opencode.jsonc` is a chezmoi-managed file committed in plaintext. Only `headers` values are documented to interpolate `{env:…}`; putting a secret in `oauth.clientSecret` would either commit it or depend on undocumented interpolation. Rejected on the secret-handling goal alone.
- **User token in the `Authorization` header.** The same Slack app produces a `xoxp-` user token directly; it carries exactly the same scopes the OAuth flow would have granted, and `headers` interpolation keeps it in the environment. Chosen.

`oauth: false` is not decoration: without it OpenCode auto-detects the OAuth-protected resource, starts a flow that cannot complete, and the explicit `Authorization` header is never the deciding factor. The flag turns auto-detection off so the header is used as-is.

### D3: The token arrives through a new age-encrypted zsh secrets file

`SLACK_MCP_TOKEN` is this repo's first long-lived API secret in the shell environment; `dot_zshrc.tmpl` currently exports nothing of the kind. Rather than invent a Slack-specific hack, the change introduces the general mechanism as its own capability (`zsh-secrets`): `encrypted_private_dot_config/zsh/secrets.zsh.age` → `~/.config/zsh/secrets.zsh` (mode `0600`), sourced from `dot_zshrc.tmpl` behind the same `[[ -f … ]] && source …` guard already used for the Catppuccin syntax-highlighting theme.

Alternatives: the macOS Keychain via `security find-generic-password` (per-host manual setup, no chezmoi story, a subprocess on every shell start); 1Password CLI `op read` (no `op` usage anywhere in this repo today — a new dependency for one token); a chezmoi `{{ onepasswordRead }}` template (same dependency, plus it makes `chezmoi apply` fail when 1Password is locked). Age wins because the repo already carries an age recipient, an encrypted file, and a documented key-bootstrap procedure — the marginal cost is one file and one `source` line.

Accepted limitation: only processes descended from an interactive zsh see the variable. OpenCode is a terminal application, so this is a non-issue in practice; a GUI-launched client would not see the token. Documented, not engineered around.

### D4: Allowlist read-only tools only, and keep the private search out of it

The Slack MCP server exposes 14 tools. Split by effect:

- **Read, allowlisted:** `slack_search_public`, `slack_search_channels`, `slack_search_users`, `slack_read_channel`, `slack_read_thread`, `slack_read_canvas`, `slack_read_user_profile`.
- **Read, deliberately not allowlisted:** `slack_search_public_and_private` — it reaches private channels and DMs, and the tool's own contract asks for explicit per-call user consent. Auto-approving it would override a consent boundary the server itself draws.
- **Write, not allowlisted:** `slack_send_message`, `slack_send_message_draft`, `slack_schedule_message`, `slack_create_canvas`, `slack_update_canvas`. Same rule already applied to memory writes, playwright and chrome-devtools.

Ids follow the plugin-provided namespace `mcp__plugin_<plugin>_<server>__<tool>`; both segments are `slack`, hence `mcp__plugin_slack_slack__slack_search_public`. The doubled prefix looks like a typo and is not — worth a comment at implementation time. A wrong id fails safe: the rule simply never matches and Claude asks, so this cannot produce an over-permission.

### D5: Nothing new for Renovate

The hosted server has no version. The plugin's version is managed by the marketplace's `autoUpdate: true`, exactly like `code-simplifier@claude-plugins-official`. So unlike the stdio servers pinned as `pkg@version` and tracked by the custom regex manager, this change adds no `renovate.json` manager and no pin to maintain.

### D6: The install script gains one plugin id and one printed line, nothing else

`CC_PLUGINS` gains `slack@claude-plugins-official`; the existing loop handles pre-scan, skip-if-installed, PTY wrapping and non-fatal failure. `CC_MARKETPLACES` is untouched. The only other edit is a Slack line in the "Manual Installation Required" section, next to the Atlassian/Figma/Linear/Notion OAuth notes, because three prerequisites are outside the script's reach: the OAuth consent, the workspace admin approval, and the OpenCode token.

## Risks / Trade-offs

- **Workspace admin has not approved the Slack MCP connector** → every client fails OAuth and the change is inert. Mitigation: the manual-instructions line states it as a prerequisite; the install script neither checks nor fails on it, so `chezmoi apply` stays green.
- **`SLACK_MCP_TOKEN` is visible to every process started from the shell** → any tool running under that shell can read the user's Slack surface. Mitigation: minimum viable scopes on the Slack app, `0600` on the secrets file, and a token that is trivially revocable from Slack's app settings without touching this repo.
- **Losing the age private key makes the encrypted token unrecoverable** → same blast radius already documented for `encrypted_dot_ticker.yaml.age`; the recovery path is regenerating the Slack token, not recovering the file. No new mitigation needed.
- **Plugin updates could rename tools and silently break the allowlist** → the failure mode is an extra confirmation prompt, never an unintended action. Mitigation: verify ids via `/mcp` when implementing, and treat drift as a follow-up chore.
- **The 8 Slack skills come bundled with the plugin** → only `slack-search` needs the MCP connection; the rest (`block-kit`, `slack-api`, `slack-cli`, `create-slack-app`, …) load on demand and cost nothing when unused. Accepted as a package deal; the plugin is not separable.
- **The two clients authenticate differently** → two things to debug instead of one, and a token that expires only on the OpenCode side. Accepted: the alternative is either borrowed credentials or a committed client secret.

## Migration Plan

1. Create the Slack app in the workspace with the read scopes the allowlisted tools need (`search:read.public`, `search:read.users`, `channels:history`, `groups:history`, `im:history`, `mpim:history`, `channels:read`, `canvases:read`, `users:read`), plus `chat:write` only if message sending is wanted; issue the `xoxp-` user token.
2. Add `SLACK_MCP_TOKEN` to the age-encrypted secrets file, apply, and confirm a fresh shell exports it.
3. Land the Claude Code side (`CC_PLUGINS` + `enabledPlugins` + `permissions.allow`), run the install script, and complete the OAuth flow from `/mcp`.
4. Land the OpenCode side (`mcp.slack` entry), restart OpenCode, confirm the server connects and tools list.
5. Update `README.md` and `docs/manual.html` last, once the observed behaviour matches the specs.

Rollback is per-side and independent: remove the `enabledPlugins` entry (or `claude plugin uninstall`) for Claude Code; set `enabled: false` or delete the `mcp.slack` entry for OpenCode; revoke the token in Slack. Removing the token alone disables OpenCode without touching Claude Code. The `zsh-secrets` capability survives any Slack rollback — it is the general mechanism, not Slack plumbing.

## Open Questions

- Whether OpenCode's `{env:…}` interpolation extends beyond `headers` to the `oauth` fields. Irrelevant to this design (D2 rejects the OAuth path for other reasons too), but it would reopen the question if Slack ever adds DCR or a public-client token endpoint.
