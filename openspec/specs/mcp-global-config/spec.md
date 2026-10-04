# Capability: mcp-global-config

## Purpose

Global MCP server configuration managed by chezmoi — defines which MCP servers are available in every Claude Code session across all machines.
## Requirements
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

### Requirement: MCP registration is idempotent and follows install script patterns

The MCP server registration group SHALL use the existing `run_claude_step` helper, `confirm` prompt pattern, and pre-scan idiom consistent with other install groups.

#### Scenario: Pre-scan shows installed vs pending count

- **WHEN** the install script reaches the MCP servers group
- **THEN** it SHALL display the count of already-registered vs pending servers (e.g., "MCP servers: 7/10 registered")

#### Scenario: Already-registered servers are skipped

- **WHEN** a server is already registered in `~/.claude.json`
- **THEN** the install script SHALL skip it with an "already registered, skipping" message

#### Scenario: Registration continues on individual failure

- **WHEN** `claude mcp add` fails for one server
- **THEN** the script SHALL log an error and continue registering remaining servers (non-fatal)

#### Scenario: Claude CLI not available

- **WHEN** `claude` is not in PATH during `chezmoi apply`
- **THEN** the MCP registration group SHALL be skipped with a warning (same guard as CC plugins group)

### Requirement: Atlassian, Figma, Linear, Notion, and Storybook included as HTTP servers with auth/setup notes

The install script SHALL register `atlassian`, `figma`, `linear`, `notion`, and `storybook` as HTTP MCP servers. The manual instructions section SHALL note authentication and setup requirements for each.

#### Scenario: HTTP servers registered with correct transport

- **WHEN** the install script registers `atlassian`, `figma`, `linear`, `notion`, and `storybook`
- **THEN** it SHALL use `claude mcp add --scope user --transport http <name> <url>`

#### Scenario: Manual auth instructions printed for OAuth servers

- **WHEN** the install script reaches the manual instructions section
- **THEN** it SHALL include a line noting that `atlassian`, `figma`, `linear`, and `notion` MCP servers require OAuth authentication via `/mcp` or first use

#### Scenario: Manual setup instructions printed for Storybook

- **WHEN** the install script reaches the manual instructions section
- **THEN** it SHALL include a line noting that `storybook` MCP requires `@storybook/addon-mcp` installed in each Storybook project and `storybook dev` running on port 6006

#### Scenario: Storybook gracefully fails when not running

- **WHEN** `storybook dev` is NOT running on localhost:6006
- **THEN** `claude mcp list` SHALL show `storybook` as failed to connect
- **AND** no error SHALL affect other MCP server connections

### Requirement: Template uses no machine-specific conditionals for MCP

The MCP server list in `run_onchange_install-packages.sh.tmpl` SHALL be plain bash arrays without chezmoi template conditionals (`{{ if }}`, `{{ else }}`). All 17 Claude Code servers are registered identically on every machine. That includes the two that resolve to `localhost` and answer only while their local process is running. It also includes `ibkr`, which holds no account data on a machine until the user completes its OAuth login there.

#### Scenario: No conditional logic in MCP server arrays

- **WHEN** reading `run_onchange_install-packages.sh.tmpl`
- **THEN** the MCP server arrays SHALL contain no chezmoi template directives

### Requirement: DeepWiki is available in every managed coding agent

The chezmoi setup SHALL provide one enabled user-scope MCP server named `deepwiki`, using Streamable HTTP at `https://mcp.deepwiki.com/mcp` without authentication, to Claude Code, Codex, OpenCode, and Junie. It SHALL NOT configure the deprecated `https://mcp.deepwiki.com/sse` endpoint or the authenticated Devin endpoint.

#### Scenario: Claude Code has DeepWiki

- **WHEN** the user confirms the Claude Code MCP registration group during `chezmoi apply`
- **THEN** `claude mcp get deepwiki` SHALL report an HTTP server at `https://mcp.deepwiki.com/mcp`

#### Scenario: Codex has DeepWiki

- **WHEN** the user confirms the Codex MCP registration group during `chezmoi apply`
- **THEN** `codex mcp get deepwiki --json` SHALL report a Streamable HTTP server at `https://mcp.deepwiki.com/mcp`

#### Scenario: OpenCode has DeepWiki

- **WHEN** `chezmoi apply` deploys the OpenCode user configuration
- **THEN** `~/.config/opencode/opencode.jsonc` SHALL contain an enabled remote `mcp.deepwiki` entry with URL `https://mcp.deepwiki.com/mcp`
- **AND** the existing `model`, `tui`, `plugin`, `formatter`, `permission`, and other MCP entries SHALL remain unchanged

#### Scenario: Junie has DeepWiki

- **WHEN** `chezmoi apply` deploys the Junie user configuration
- **THEN** `~/.junie/mcp/mcp.json` SHALL contain `mcpServers.deepwiki.url` equal to `https://mcp.deepwiki.com/mcp`
- **AND** the entry SHALL require no headers, environment variables, or credentials

#### Scenario: Existing Junie configuration survives apply

- **WHEN** `~/.junie/mcp/mcp.json` contains valid unrelated servers or unknown top-level values and `chezmoi apply` runs
- **THEN** those values SHALL remain unchanged while `mcpServers.deepwiki` converges to the managed endpoint
- **AND** the separately managed `mcpServers.linear` entry SHALL remain present

### Requirement: Codex MCP registration preserves runtime-owned configuration

The setup SHALL drive Codex through its official `codex mcp` CLI and SHALL NOT introduce a chezmoi-managed `dot_codex/config.toml`. DeepWiki SHALL be declared alongside other managed HTTP entries in `CODEX_HTTP_MCP_SERVERS` and processed through the shared `configure_codex_mcp_servers` module. Registration SHALL be idempotent, SHALL replace an existing `deepwiki` entry only when its URL differs, and SHALL treat an individual registration failure as non-fatal. The module SHALL NOT invoke `codex mcp login` or manage credentials; authentication SHALL remain a separate user action, while accounting for `codex mcp add` potentially initiating OAuth itself.

#### Scenario: Matching Codex registration exists

- **WHEN** `codex mcp get deepwiki --json` reports `https://mcp.deepwiki.com/mcp`
- **THEN** the setup SHALL report the server as already registered
- **AND** it SHALL NOT remove or re-add the entry

#### Scenario: Codex registration is missing

- **WHEN** Codex is available and no `deepwiki` MCP entry exists
- **AND** the user confirms the Codex MCP registration group
- **THEN** the setup SHALL run `codex mcp add deepwiki --url https://mcp.deepwiki.com/mcp`

#### Scenario: Codex registration has a stale URL

- **WHEN** Codex reports a `deepwiki` MCP entry with a different URL
- **AND** the user confirms the Codex MCP registration group
- **THEN** the setup SHALL replace only that entry with `https://mcp.deepwiki.com/mcp`

#### Scenario: Codex replacement fails

- **WHEN** setup removes a stale HTTP `deepwiki` entry and adding the managed URL fails
- **THEN** setup SHALL attempt to restore the previous URL
- **AND** the failure SHALL remain non-fatal

#### Scenario: Codex entry cannot be replaced safely

- **WHEN** Codex reports an existing `deepwiki` entry whose transport is not `streamable_http` or whose URL is not a non-empty string
- **THEN** setup SHALL leave that entry unchanged and warn the user

#### Scenario: Codex is unavailable

- **WHEN** `codex` is not in `PATH`
- **THEN** the Codex MCP registration group SHALL be skipped with a warning
- **AND** subsequent setup groups SHALL continue

#### Scenario: Authentication is outside installer responsibility

- **WHEN** the shared Codex MCP registration module is inspected
- **THEN** it SHALL contain no invocation of `codex mcp login`
- **AND** every OAuth grant SHALL remain Codex-owned outside chezmoi source state

### Requirement: DeepWiki limitations and routing are documented

User documentation SHALL describe DeepWiki as a provider-managed, free, unauthenticated service for already-indexed public GitHub repositories. It SHALL explain that an unindexed repository must be submitted by visiting its DeepWiki URL, that private Nazaries repositories require the separate authenticated Devin MCP and are unsupported by this entry, and that DeepWiki cannot select a branch, tag, or commit.

The guidance SHALL position Context7 for published library API documentation, DeepWiki for architecture and internal-flow exploration on an already-indexed public repository, and `gh_grep` or direct WebFetch for exact source citations and revision-sensitive verification.

#### Scenario: User investigates an unindexed repository

- **WHEN** DeepWiki reports that a public repository was not found
- **THEN** the documentation SHALL direct the user to visit `https://deepwiki.com/<owner>/<repo>` to request indexing
- **AND** it SHALL NOT claim that the MCP call indexes the repository on demand

#### Scenario: User investigates a private repository

- **WHEN** the target repository is private
- **THEN** the documentation SHALL state that the configured DeepWiki server cannot access it
- **AND** it SHALL NOT direct the user to add a Devin API key to the public `deepwiki` entry

#### Scenario: User needs version-specific evidence

- **WHEN** an answer depends on a branch, tag, commit, exact file path, or line-level behavior
- **THEN** the documentation SHALL direct the user to verify the claim with `gh_grep` or direct source retrieval

### Requirement: DeepWiki has no local update lifecycle

DeepWiki SHALL be classified as a provider-managed remote service. The setup SHALL NOT install a local package, store an API key, add a Renovate pin, or add an `update-extra` step for DeepWiki.

#### Scenario: Update mechanisms are inspected

- **WHEN** the install script, Renovate configuration, and `update-extra` workflow are inspected
- **THEN** DeepWiki SHALL appear only as remote MCP configuration and documentation
- **AND** no local DeepWiki update action SHALL exist

### Requirement: Expect MCP server is registered globally in OpenCode config

`dot_config/opencode/opencode.jsonc` SHALL contain an `mcp` key with an `expect` server entry using the OpenCode local MCP format.

#### Scenario: Expect MCP server present in OpenCode config after chezmoi apply

- **WHEN** `chezmoi apply` is run on a new machine
- **THEN** `~/.config/opencode/opencode.jsonc` SHALL contain an `mcp` object with an `expect` entry of type `"local"`, command `["npx", "-y", "expect-cli@latest", "mcp"]`, and `enabled: true`

#### Scenario: OpenCode MCP section does not affect existing config keys

- **WHEN** `chezmoi apply` deploys the updated OpenCode config
- **THEN** the `model`, `tui`, `plugin`, `formatter`, and `permission` keys SHALL remain unchanged

### Requirement: JetBrains IDE MCP is available in every managed coding agent

The chezmoi setup SHALL provide one enabled user-scope MCP server named `jetbrains`, using Streamable HTTP at `http://localhost:64542/stream` without authentication, to Claude Code, Codex, OpenCode, and Junie.

The port SHALL be `64542`. It is not arbitrary: the bundled `com.intellij.mcpServer` plugin computes its default listening port as a fixed base of `64342` plus a per-product offset, and WebStorm's offset is `+200`. `64342` is IntelliJ IDEA's default (offset `0`) and SHALL NOT be used.

The endpoint SHALL be `/stream`, the plugin's Streamable HTTP transport. The plugin also serves the deprecated SSE transport at `/sse`; managed entries SHALL NOT use it, so that all four agents reuse the existing Streamable HTTP registration paths and no agent carries a second transport shape.

#### Scenario: Claude Code has JetBrains

- **WHEN** the user confirms the Claude Code MCP registration group during `chezmoi apply`
- **THEN** `claude mcp get jetbrains` SHALL report an HTTP server at `http://localhost:64542/stream`

#### Scenario: Codex has JetBrains

- **WHEN** the user confirms the Codex MCP registration group during `chezmoi apply`
- **THEN** `codex mcp get jetbrains --json` SHALL report a Streamable HTTP server at `http://localhost:64542/stream`

#### Scenario: OpenCode has JetBrains

- **WHEN** `chezmoi apply` deploys the OpenCode user configuration
- **THEN** `~/.config/opencode/opencode.jsonc` SHALL contain an enabled remote `mcp.jetbrains` entry with URL `http://localhost:64542/stream`
- **AND** the existing `model`, `tui`, `plugin`, `formatter`, `permission`, and other MCP entries SHALL remain unchanged

#### Scenario: Junie has JetBrains

- **WHEN** `chezmoi apply` deploys the Junie user configuration
- **THEN** `~/.junie/mcp/mcp.json` SHALL contain `mcpServers.jetbrains.url` equal to `http://localhost:64542/stream`
- **AND** the entry SHALL require no headers, environment variables, or credentials

#### Scenario: Drifted hand-added entry is corrected

- **WHEN** an agent's configuration already contains a `jetbrains` entry pointing at `http://localhost:64342/sse`
- **AND** the user confirms the relevant MCP registration group
- **THEN** the setup SHALL replace that entry with the managed Streamable HTTP endpoint
- **AND** it SHALL NOT leave both the stale and the managed entry registered

#### Scenario: Managed entry carries no SSE transport

- **WHEN** the install script, OpenCode configuration, and Junie merge template are inspected
- **THEN** no managed `jetbrains` entry SHALL declare an `sse` transport or a `/sse` URL

### Requirement: JetBrains MCP availability is bound to a running IDE

The `jetbrains` server SHALL be documented as a local service whose lifetime is the IDE process, not a remote always-on endpoint. A connection failure while WebStorm is closed SHALL be expected behavior rather than a misconfiguration, and SHALL NOT affect other MCP server connections.

Enabling the IDE-side server SHALL remain outside chezmoi's scope: the JetBrains IDE configuration is not managed by this repository. Documentation SHALL state the one-time manual prerequisite and SHALL NOT imply that `chezmoi apply` performs it.

#### Scenario: WebStorm is not running

- **WHEN** WebStorm is closed and an agent lists its MCP servers
- **THEN** `jetbrains` SHALL report a connection failure
- **AND** no error SHALL affect other MCP server connections

#### Scenario: Manual prerequisite is printed

- **WHEN** the install script reaches the manual instructions section
- **THEN** it SHALL include a line noting that `jetbrains` MCP requires Settings → Tools → MCP Server enabled in the JetBrains IDE
- **AND** it SHALL note that the IDE must be running for the server to answer

#### Scenario: IDE settings are not managed

- **WHEN** the chezmoi source state is inspected
- **THEN** it SHALL contain no JetBrains IDE settings, `.vmoptions`, or MCP-server enablement file
- **AND** the port SHALL be consumed as the plugin's WebStorm default rather than forced by a managed IDE option

### Requirement: JetBrains MCP has no local update lifecycle

The `jetbrains` server SHALL be classified as an IDE-provided local service. The setup SHALL NOT install a local package, store a credential, add a Renovate pin, or add an `update-extra` step for it. Its version SHALL be owned by the JetBrains IDE release that bundles the plugin.

#### Scenario: Update mechanisms are inspected

- **WHEN** the install script, Renovate configuration, and `update-extra` workflow are inspected
- **THEN** `jetbrains` SHALL appear only as MCP configuration and documentation
- **AND** no local JetBrains MCP update action SHALL exist

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
