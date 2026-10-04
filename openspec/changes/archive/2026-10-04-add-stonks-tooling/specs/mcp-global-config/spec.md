# Delta: mcp-global-config

## MODIFIED Requirements

### Requirement: Global MCP servers are registered via Claude CLI in install script

`run_onchange_install-packages.sh.tmpl` SHALL register the following 17 MCP servers via `claude mcp add --scope user`, which writes to `~/.claude.json`:

| Name            | Type  | Command/URL                                            |
| --------------- | ----- | ------------------------------------------------------ |
| eslint          | stdio | `npx -y @eslint/mcp@0.3.12`                            |
| context7        | stdio | `npx -y @upstash/context7-mcp@4.1.1`                   |
| knip            | stdio | `npx -y @knip/mcp@0.0.36`                              |
| memory          | stdio | `npx -y @modelcontextprotocol/server-memory@2026.7.4`  |
| playwright      | stdio | `npx -y @playwright/mcp@0.0.81`                        |
| chrome-devtools | stdio | `npx -y chrome-devtools-mcp@1.9.0`                     |
| expect          | stdio | `npx -y expect-cli@0.1.3 mcp`                          |
| fallow          | stdio | `fallow-mcp` (PATH binary from the global npm install) |
| gh_grep         | http  | `https://mcp.grep.app`                                 |
| deepwiki        | http  | `https://mcp.deepwiki.com/mcp`                         |
| atlassian       | http  | `https://mcp.atlassian.com/v1/mcp`                     |
| figma           | http  | `https://mcp.figma.com/mcp`                            |
| linear          | http  | `https://mcp.linear.app/mcp`                           |
| notion          | http  | `https://mcp.notion.com/mcp`                           |
| storybook       | http  | `http://localhost:6006/mcp`                            |
| jetbrains       | http  | `http://localhost:64542/stream`                        |
| ibkr            | http  | `https://api.ibkr.com/v1/api/mcp-public`               |

`dot_claude/modify_settings.json.tmpl` SHALL NOT contain an `mcpServers` key.

#### Scenario: All 14 servers registered after install script runs

- **WHEN** `chezmoi apply` runs the install script on a machine with `claude` CLI available
- **AND** the user confirms the MCP servers install group
- **THEN** `claude mcp list --scope user` SHALL still list the servers in the table above other than `deepwiki`, `jetbrains` and `ibkr`

#### Scenario: DeepWiki is registered as the fifteenth server

- **WHEN** `chezmoi apply` runs the install script on a machine with `claude` CLI available
- **AND** the user confirms the MCP servers install group
- **THEN** `claude mcp list --scope user` SHALL also list `deepwiki` at `https://mcp.deepwiki.com/mcp`

#### Scenario: JetBrains is registered as the sixteenth server

- **WHEN** `chezmoi apply` runs the install script on a machine with `claude` CLI available
- **AND** the user confirms the MCP servers install group
- **THEN** `claude mcp list --scope user` SHALL also list `jetbrains` at `http://localhost:64542/stream`

#### Scenario: IBKR is registered as the seventeenth server

- **WHEN** `chezmoi apply` runs the install script on a machine with `claude` CLI available
- **AND** the user confirms the MCP servers install group
- **THEN** `claude mcp list --scope user` SHALL also list `ibkr` at `https://api.ibkr.com/v1/api/mcp-public`
- **AND** the group's pre-scan total SHALL count 17 servers

#### Scenario: Servers registered to correct file

- **WHEN** a stdio MCP server is registered via the install script
- **THEN** `~/.claude.json` SHALL contain the server under the `mcpServers` key
- **AND** `~/.claude/settings.json` SHALL NOT contain an `mcpServers` key

#### Scenario: Settings template has no mcpServers block

- **WHEN** reading `dot_claude/modify_settings.json.tmpl`
- **THEN** the file SHALL NOT contain an `mcpServers` key at any level

#### Scenario: Stdio servers use pinned versions managed by Renovate

- **WHEN** inspecting registered stdio servers via `claude mcp get <name>`
- **THEN** the 7 npx-launched stdio servers SHALL reference pinned versions (not `@latest`)
- **AND** `renovate.json` SHALL contain a custom regex manager for the install script template

#### Scenario: Fallow server runs the global binary without a pin

- **WHEN** inspecting the `fallow` server via `claude mcp get fallow`
- **THEN** its command SHALL be the bare `fallow-mcp` binary (no npx, no version pin)
- **AND** its version SHALL be owned by the global npm install (updated via `update-extra`), so the MCP server and the `fallow` CLI it shells out to can never skew from each other

#### Scenario: Fallow entry is presence-checked only

- **WHEN** the install script pre-scans MCP servers for outdated pins
- **THEN** the `fallow` entry SHALL participate in presence detection only, not in the `pkg@version` outdated-check

### Requirement: Template uses no machine-specific conditionals for MCP

The MCP server list in `run_onchange_install-packages.sh.tmpl` SHALL be plain bash arrays without chezmoi template conditionals (`{{ if }}`, `{{ else }}`). All 17 Claude Code servers are registered identically on every machine. That includes the two that resolve to `localhost` and answer only while their local process is running. It also includes `ibkr`, which holds no account data on a machine until the user completes its OAuth login there.

#### Scenario: No conditional logic in MCP server arrays

- **WHEN** reading `run_onchange_install-packages.sh.tmpl`
- **THEN** the MCP server arrays SHALL contain no chezmoi template directives

## ADDED Requirements

### Requirement: IBKR MCP is registered for Claude Code under the fixed name ibkr

The install script SHALL register Interactive Brokers' official MCP server through the `MCP_HTTP_SERVERS` array. The registration SHALL use the name `ibkr`, the `http` transport and the URL `https://api.ibkr.com/v1/api/mcp-public`, and SHALL go through the group's existing loop, which runs `claude mcp add --scope user --transport http ibkr https://api.ibkr.com/v1/api/mcp-public`.

The name SHALL be exactly `ibkr`. It is a contract with two consumers:

- The read identifiers required by the `stonks` plugin in the `daily-agentic-task-force` marketplace are `mcp__ibkr__get_account_positions` and `mcp__ibkr__get_account_orders`.
- The deny rules in `claude-user-preferences` target `mcp__ibkr__create_order_instruction` and `mcp__ibkr__delete_order_instruction`.

Under any other name the plugin cannot find its tools, and the deny rules match nothing, which would leave instruction creation and deletion callable. A change that renames the server SHALL move both deny rules in the same change.

#### Scenario: Claude Code has IBKR

- **WHEN** the user confirms the Claude Code MCP registration group during `chezmoi apply`
- **THEN** `claude mcp get ibkr` SHALL report an HTTP server at `https://api.ibkr.com/v1/api/mcp-public`

#### Scenario: Re-running on a registered host is a no-op

- **WHEN** the install script runs on a host where `ibkr` is already registered at that URL
- **THEN** the script SHALL report it as already registered and SHALL NOT remove or re-add it
- **AND** the user's existing IBKR OAuth grant SHALL be left in place

#### Scenario: Tool identifiers follow the server name

- **WHEN** the server is connected in a Claude Code session
- **THEN** its tools SHALL be exposed as `mcp__ibkr__<tool>`, including `mcp__ibkr__get_account_positions`, `mcp__ibkr__get_account_orders`, `mcp__ibkr__create_order_instruction` and `mcp__ibkr__delete_order_instruction`

#### Scenario: Renaming the server carries both deny rules

- **WHEN** a change replaces the `ibkr` name in `MCP_HTTP_SERVERS`
- **THEN** the same change SHALL replace both `mcp__ibkr__create_order_instruction` and `mcp__ibkr__delete_order_instruction` in `permissions.deny` with their identifiers under the new name

### Requirement: IBKR MCP is not registered in other coding agents

The `ibkr` server SHALL be available to Claude Code only. It SHALL NOT be added to `CODEX_HTTP_MCP_SERVERS`, to the `mcp` object of `dot_config/opencode/opencode.jsonc`, or to `~/.junie/mcp/mcp.json`. The guard that stops order drafting is a Claude Code permission rule, and the other three agents would reach the same account without it. The server's only consumer, the `stonks` plugin, is a Claude Code plugin.

#### Scenario: Other agents have no IBKR entry

- **WHEN** `CODEX_HTTP_MCP_SERVERS`, `dot_config/opencode/opencode.jsonc` and the Junie merge template are inspected
- **THEN** none of them SHALL contain an entry named `ibkr` or an entry pointing at `https://api.ibkr.com/v1/api/mcp-public`

#### Scenario: Parity gap is recorded

- **WHEN** `.agents/skills/sync-agent-config/parity.md` is read
- **THEN** it SHALL contain an `IBKR MCP` row whose Codex, OpenCode and Junie cells are `none`, with a note giving the missing order-drafting deny as the reason

### Requirement: IBKR MCP authenticates through OAuth on first use with no stored credential

The `ibkr` registration SHALL carry no header, client ID, client secret, token or account identifier. The install script SHALL NOT pass `--header`, `--client-id`, `--client-secret` or `--callback-port` for it. Access SHALL be granted by the user through IBKR's own OAuth flow on first use, started from `/mcp` inside Claude Code. That flow covers:

- IBKR's login screen, including its second factor;
- acceptance of IBKR's AI-integration agreements;
- the choice of one account.

The resulting grant SHALL stay in Claude Code's own credential storage, outside the chezmoi source state and outside the age-encrypted files.

The "Manual Installation Required" section of the install script SHALL include an IBKR line that names all of the following:

- `/mcp` as the place to authenticate `ibkr`;
- the login, agreement and account-choice steps;
- revocation under Client Portal → Settings → Manage Third-Party Consents;
- the fact that order instruction creation and deletion are denied in the managed Claude Code settings.

#### Scenario: Manual instructions cover IBKR authentication

- **WHEN** the install script reaches the manual instructions section on macOS
- **THEN** it SHALL print a line stating that the IBKR MCP requires OAuth authentication through `/mcp`
- **AND** the line SHALL name IBKR's login and AI agreements, the single-account choice, the Manage Third-Party Consents revocation path, and both denied order instruction tools

#### Scenario: IBKR tools are unavailable until authenticated

- **WHEN** `ibkr` is registered but the user has not completed its OAuth flow on that machine
- **THEN** IBKR tool calls SHALL fail with an authentication error
- **AND** no other MCP server connection SHALL be affected

#### Scenario: No credential enters the repository

- **WHEN** the install script, the settings template, the README, the manual and the rest of the chezmoi source tree are inspected
- **THEN** they SHALL contain no IBKR token, client secret, account number or header for the `ibkr` server

### Requirement: IBKR MCP has no local update lifecycle

The `ibkr` server SHALL be classified as a provider-managed remote service. The setup SHALL NOT install a local package, store a credential, add a Renovate pin, or add an `update-extra` step for it. Its tool set and output shapes are owned by Interactive Brokers.

#### Scenario: Update mechanisms are inspected

- **WHEN** the install script, Renovate configuration, and `update-extra` workflow are inspected
- **THEN** `ibkr` SHALL appear only as MCP configuration and documentation
- **AND** no local IBKR MCP update action SHALL exist
