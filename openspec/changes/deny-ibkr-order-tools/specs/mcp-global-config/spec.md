## MODIFIED Requirements

### Requirement: IBKR MCP is registered for Claude Code under the fixed name ibkr

The install script SHALL register Interactive Brokers' official MCP server through the `MCP_HTTP_SERVERS` array. The registration SHALL use the name `ibkr`, the `http` transport and the URL `https://api.ibkr.com/v1/api/mcp-public`, and SHALL go through the group's existing loop, which runs `claude mcp add --scope user --transport http ibkr https://api.ibkr.com/v1/api/mcp-public`.

The name SHALL be exactly `ibkr`. It is a contract with two consumers:

- The read identifiers required by the `stonks` plugin in the `daily-agentic-task-force` marketplace are `mcp__ibkr__get_account_positions` and `mcp__ibkr__get_account_orders`.
- The deny rules in `claude-user-preferences` target `mcp__ibkr__create_order_instruction`, `mcp__ibkr__delete_order_instruction`, `mcp__ibkr__submit_order`, `mcp__ibkr__modify_order`, `mcp__ibkr__cancel_order` and `mcp__ibkr__answer_order_question`.

Under any other name the plugin cannot find its tools, and the deny rules match nothing, which would leave order placement, change and cancellation callable. A change that renames the server SHALL move every IBKR deny rule in the same change.

#### Scenario: Claude Code has IBKR

- **WHEN** the user confirms the Claude Code MCP registration group during `chezmoi apply`
- **THEN** `claude mcp get ibkr` SHALL report an HTTP server at `https://api.ibkr.com/v1/api/mcp-public`

#### Scenario: Re-running on a registered host is a no-op

- **WHEN** the install script runs on a host where `ibkr` is already registered at that URL
- **THEN** the script SHALL report it as already registered and SHALL NOT remove or re-add it
- **AND** the user's existing IBKR OAuth grant SHALL be left in place

#### Scenario: Tool identifiers follow the server name

- **WHEN** the server is connected in a Claude Code session
- **THEN** its tools SHALL be exposed as `mcp__ibkr__<tool>`, including `mcp__ibkr__get_account_positions`, `mcp__ibkr__get_account_orders`, `mcp__ibkr__submit_order`, `mcp__ibkr__modify_order`, `mcp__ibkr__cancel_order` and `mcp__ibkr__answer_order_question`

#### Scenario: Renaming the server carries both deny rules

- **WHEN** a change replaces the `ibkr` name in `MCP_HTTP_SERVERS`
- **THEN** the same change SHALL replace all six IBKR rules in `permissions.deny`, listed in the contract above, with their identifiers under the new name

### Requirement: IBKR MCP is not registered in other coding agents

The `ibkr` server SHALL be available to Claude Code only. It SHALL NOT be added to `CODEX_HTTP_MCP_SERVERS`, to the `mcp` object of `dot_config/opencode/opencode.jsonc`, or to `~/.junie/mcp/mcp.json`. The guard that stops order placement is a Claude Code permission rule, and the other three agents would reach the same account without it. The server's only consumer, the `stonks` plugin, is a Claude Code plugin.

#### Scenario: Other agents have no IBKR entry

- **WHEN** `CODEX_HTTP_MCP_SERVERS`, `dot_config/opencode/opencode.jsonc` and the Junie merge template are inspected
- **THEN** none of them SHALL contain an entry named `ibkr` or an entry pointing at `https://api.ibkr.com/v1/api/mcp-public`

#### Scenario: Parity gap is recorded

- **WHEN** `.agents/skills/sync-agent-config/parity.md` is read
- **THEN** it SHALL contain an `IBKR MCP` row whose Codex, OpenCode and Junie cells are `none`, with a note giving the missing order-placement deny as the reason

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
- the fact that order submission, change, cancellation and question answers, and order instruction creation and deletion, are denied in the managed Claude Code settings.

#### Scenario: Manual instructions cover IBKR authentication

- **WHEN** the install script reaches the manual instructions section on macOS
- **THEN** it SHALL print a line stating that the IBKR MCP requires OAuth authentication through `/mcp`
- **AND** the line SHALL name IBKR's login and AI agreements, the single-account choice, the Manage Third-Party Consents revocation path, and all six denied IBKR tools

#### Scenario: IBKR tools are unavailable until authenticated

- **WHEN** `ibkr` is registered but the user has not completed its OAuth flow on that machine
- **THEN** IBKR tool calls SHALL fail with an authentication error
- **AND** no other MCP server connection SHALL be affected

#### Scenario: No credential enters the repository

- **WHEN** the install script, the settings template, the README, the manual and the rest of the chezmoi source tree are inspected
- **THEN** they SHALL contain no IBKR token, client secret, account number or header for the `ibkr` server
