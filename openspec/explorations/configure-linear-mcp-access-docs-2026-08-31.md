# Linear MCP client documentation check (2026-08-31)

## Scope and conclusion

This note records the task 1.2 check for `configure-linear-mcp-access`. It uses
current first-party documentation for Linear, Claude Code, OpenCode, Codex,
JetBrains Junie, Bun, and `mcp-remote`, supplemented by read-only help/output from
the locally installed clients.

**Result: the endpoint, transport, OAuth model, and user-scope paths remain valid,
but the planning artifacts contain one blocking command error and one Codex
interaction assumption that should be resolved before implementation.**

1. `bunx --yes` is not a supported Bun invocation. The planned OpenCode command
   must be `bunx mcp-remote@0.8.3 https://mcp.linear.app/mcp` (without `--yes`).
2. Current Codex can configure the server either through `codex mcp` or directly in
   `~/.codex/config.toml`, and adding an OAuth-capable HTTP server may immediately
   begin login. The artifacts currently describe add and login as strictly separate
   and reject managed config as though CLI ownership were necessary. That is a
   repository policy choice, not a Codex limitation.

OpenCode and Junie now both support native remote MCP plus OAuth. Retaining
`mcp-remote` for OpenCode is therefore an explicit acceptance constraint, not a
technical compatibility requirement.

## Verified contract

| Client/surface | Current official behavior | Configuration and auth ownership | Drift from artifacts |
| --- | --- | --- | --- |
| Linear | The read-write endpoint is `https://mcp.linear.app/mcp`; its primary transport is Streamable HTTP and interactive authentication is OAuth 2.1 with dynamic client registration. `/mcp/readonly` is read-only. `/sse` is deprecated and scheduled for removal. | Hosted by Linear; each MCP client owns its own grant. | No endpoint or access-mode drift. The artifacts correctly reject `/sse` and `/mcp/readonly` for write acceptance. |
| Claude Code | Remote HTTP is recommended. The supported user-scope command is `claude mcp add --transport http linear --scope user https://mcp.linear.app/mcp` (option order may also place `--scope user` before the name). Authenticate with `/mcp` or `claude mcp login linear`; inspect with `claude mcp get linear` or `claude mcp list`. | User/local MCP definitions are in `~/.claude.json`; user scope is available across projects. OAuth tokens are stored securely and refreshed by Claude Code; the docs do not promise an exact token file path. | No material drift. Prefer the server name `linear` consistently; Linear's example uses `linear-server`, but the name is client-local. |
| OpenCode (current stable docs) | A local server is `{ "type": "local", "command": [...], "enabled": true }`. OpenCode also supports native `{ "type": "remote", "url": "..." }` with automatic OAuth/DCR and `opencode mcp auth <name>`. | Global config is `~/.config/opencode/opencode.json(c)`. Native remote OAuth tokens live at `~/.local/share/opencode/mcp-auth.json`. When this change deliberately uses the local `mcp-remote` bridge instead, the bridge owns credentials in `~/.mcp-auth` (or `MCP_REMOTE_CONFIG_DIR`), so `opencode mcp auth linear` is not the auth path for that local entry. | The selected local shape remains valid, but `mcp-remote` is compatibility-only and the planned `--yes` argument is invalid for Bun. |
| Codex | Codex supports Streamable HTTP, bearer auth, and OAuth (including CIMD and DCR). The supported command is `codex mcp add linear --url https://mcp.linear.app/mcp`; `codex mcp login linear` starts/restarts OAuth. Direct config is `[mcp_servers.linear]` plus `url = "https://mcp.linear.app/mcp"`. | Personal MCP config is in `~/.codex/config.toml`; project scope is `.codex/config.toml` for trusted projects. CLI, IDE, and ChatGPT desktop on the same host share it. `mcp_oauth_credentials_store` selects `auto`, `file`, or `keyring`; credentials are not part of the MCP table. | No `rmcp` feature flag is required by current OpenAI docs. Linear's page still shows the obsolete `experimental_use_rmcp_client` note, so repository docs must not copy it. The artifacts should also account for add potentially starting OAuth immediately. |
| Junie | User-scope remote MCP JSON is `{ "mcpServers": { "linear": { "url": "https://mcp.linear.app/mcp" } } }`; manually added entries are enabled by default. In `/mcp`, select the server, choose **Authorize**, complete browser login, and verify **Active**. | User config is `~/.junie/mcp/mcp.json`; project config is `.junie/mcp/mcp.json`. Junie owns OAuth runtime state; current docs do not publish an exact token path. | No material drift. The merge-only `mcpServers.linear` design matches the current JSON shape and preserves Installation Assistant entries. |

## Sources and evidence

### Linear endpoint and authentication

Linear's current [MCP server documentation](https://linear.app/docs/mcp) identifies
Streamable HTTP as the primary transport, `https://mcp.linear.app/mcp` as the
default read-write endpoint, `/mcp/readonly` as the restricted endpoint, and OAuth
2.1 with dynamic client registration as the interactive flow. It describes
`mcp-remote` as backwards compatibility for clients without native remote MCP and
documents its default auth directory as `~/.mcp-auth`.

Linear's [February 2026 deprecation notice](https://linear.app/changelog/2026-02-05-linear-mcp-for-product-management)
says `/sse` is being removed and directs new connections to `/mcp`. The main MCP
page still calls `/sse` a deprecated fallback for a narrow WSL case; this does not
change the new-setup rule.

### Claude Code

The current [Claude Code MCP guide](https://code.claude.com/docs/en/mcp) documents:

- `http` as the recommended remote transport and `streamable-http` as its JSON
  alias;
- `--scope user`, stored in `~/.claude.json` and available across projects;
- OAuth for HTTP servers through `/mcp` or `claude mcp login <name>`;
- `claude mcp get <name>` and `claude mcp list` for inspection; and
- secure client-owned token storage and refresh without promising a portable token
  file.

The locally installed Claude Code `2.1.251` also exposes `mcp login`, `logout`,
`get`, and `list`, matching the documentation.

### OpenCode and the compatibility bridge

The current stable [OpenCode MCP guide](https://opencode.ai/docs/mcp-servers/)
documents both the selected local command-array form and native remote OAuth with
dynamic client registration. It also documents native token storage at
`~/.local/share/opencode/mcp-auth.json`. The [OpenCode configuration guide](https://opencode.ai/docs/config/)
places global JSON/JSONC at `~/.config/opencode/opencode.json(c)`.

The `mcp-remote` maintainer's [primary README](https://github.com/punkpeye/mcp-remote)
states that the bridge can be removed once the client supports authorized remote
servers, and that bridge credentials live in `~/.mcp-auth` or
`MCP_REMOTE_CONFIG_DIR`. Its `-y` example is specifically an `npx` installation
prompt flag, not an `mcp-remote` argument.

Bun's current [`bunx` reference](https://bun.sh/docs/pm/bunx) defines the grammar as
`bunx [flags] <package>[@version] [flags and arguments for the package]`. Its Bun-side
flags are `--bun`, `--package`, `--no-install`, `--verbose`, and `--silent`; there is
no `--yes`. `bunx` already installs a missing package automatically. The valid pinned
command is therefore:

```json
["bunx", "mcp-remote@0.8.3", "https://mcp.linear.app/mcp"]
```

The local registry query on 2026-08-31 reports `mcp-remote` `0.8.3`, so the selected
pin exists and is current; the problem is only the transplanted `npx -y` flag.

### Codex

Official OpenAI documentation for [MCP in Codex](https://developers.openai.com/codex/mcp)
documents native Streamable HTTP, OAuth/CIMD/DCR, `codex mcp add ... --url ...`,
`codex mcp login <name>`, and both CLI and direct `config.toml` setup. It places
personal configuration at `~/.codex/config.toml` and project configuration at
`.codex/config.toml` for trusted projects. The [configuration basics](https://developers.openai.com/codex/config-basic)
confirm the user path and precedence, while the [configuration reference](https://developers.openai.com/codex/config-reference)
documents `mcp_servers.<id>.url`, the default `oauth` auth mode, and
`mcp_oauth_credentials_store = "auto" | "file" | "keyring"`.

Read-only checks against installed `codex-cli 0.151.0` confirmed the current syntax:

- `codex mcp add <NAME> --url <URL>` labels the URL as Streamable HTTP;
- `codex mcp list --json` and `codex mcp get <NAME> --json` are available;
- list JSON is an array whose entries contain `name`, a nested `transport` object,
  and `auth_status`; and
- `codex mcp login <NAME>` authenticates with OAuth.

The add command's current OAuth-registration options describe an "immediate login",
and Linear's current client-specific instructions say `codex mcp add linear --url ...`
automatically prompts for Linear login. A later explicit `codex mcp login linear`
remains supported, but automation must not assume `add` is always registration-only.

There is no OpenAI restriction against managing the Linear table in
`~/.codex/config.toml`. Avoiding whole-file ownership is prudent because the same
file contains unrelated user preferences, but a style-preserving chezmoi `modify_`
script that owns only `mcp_servers.linear` would preserve those preferences just as
the proposed Junie merge does. CLI-only reconciliation is therefore optional.

### Junie

JetBrains' current [Junie MCP configuration guide](https://junie.jetbrains.com/docs/junie-cli-mcp-configuration.html)
(updated 2026-08-28) says Junie CLI and the IDE share the same MCP JSON, documents
the user path `~/.junie/mcp/mcp.json`, accepts a remote server with only `url`, and
documents `/mcp` **Authorize** followed by **Active**. The [Junie MCP Settings page](https://junie.jetbrains.com/docs/junie-plugin-mcp-settings.html)
confirms that multiple servers coexist under `mcpServers`.

The older-looking statement in the [Junie IDE overview](https://junie.jetbrains.com/docs/junie-ide-plugin.html)
that security tokens are not supported *in MCP configs* concerns embedding static
secrets. It does not contradict the newer interactive remote OAuth flow.

## Required artifact updates before apply resumes

### Required regardless of the Codex ownership choice

1. In `design.md`, replace the OpenCode command array with:

   ```json
   ["bunx", "mcp-remote@0.8.3", "https://mcp.linear.app/mcp"]
   ```

2. In `tasks.md` task 2.1, remove `--yes` from the required and verified array.
3. Ensure subsequent README/manual/install-output text also uses the Bun form without
   `--yes`; keep `mcp-remote@0.8.3` pinned and retain Renovate ownership.
4. State explicitly that OpenCode could use native remote OAuth today, while this
   change retains the bridge only because the confirmed acceptance constraint asks
   for it. State that bridge credentials are in `~/.mcp-auth`, not OpenCode's native
   `mcp-auth.json`.
5. Do not add Linear's stale `experimental_use_rmcp_client` setting to Codex docs or
   config.

### Codex decision to settle in the artifacts

Choose one coherent ownership model before implementation:

**A. Merge-managed Linear table (recommended if the user wants Codex config managed).**

- Add a style-preserving `dot_codex/modify_config.toml.tmpl` that owns only
  `mcp_servers.linear.url` (and, if desired for clarity, `auth = "oauth"`) while
  preserving every unrelated table, comment, and setting.
- Reuse the repository's existing `uv` + pinned `tomlkit` fail-closed modifier
  pattern.
- Keep OAuth as `codex mcp login linear`; do not store credentials in chezmoi.
- Replace the proposal/design/spec/tasks language that mandates CLI reconciliation,
  and update parity/docs to call the table merge-managed while OAuth remains
  Codex-owned.

**B. Keep CLI reconciliation.**

- Retain narrow `codex mcp list --json` inspection and removal of only `linear`.
- Revise design, spec, tasks, tests, and docs to acknowledge that `codex mcp add`
  may immediately start OAuth and open a browser. Do not claim registration is always
  non-interactive or strictly separate from login.
- Define and test the desired behavior when add writes the config but interactive
  authentication is cancelled or unavailable; a later `codex mcp login linear`
  remains the recovery path.

Until the unsupported Bun command and the Codex ownership/login behavior are resolved
in the planning artifacts, task 1.2 should remain incomplete and implementation should
pause under the apply-change guardrails.
