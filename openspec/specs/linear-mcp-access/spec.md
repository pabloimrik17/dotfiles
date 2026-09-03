# Capability: linear-mcp-access

## Purpose

Provide reproducible, secure user-level access to Linear's hosted MCP server from every currently supported coding agent, while keeping authentication material out of version control and preserving an explicit revalidation path for Junie.

## Requirements

### Requirement: All clients use the official read-write Linear endpoint

Claude Code, OpenCode, Codex, and Junie SHALL have a user-scope Linear entry at `https://mcp.linear.app/mcp`. Claude Code, OpenCode, and Codex SHALL provide authenticated connectivity. Junie SHALL remain preconfigured but SHALL NOT be treated as Active or connected until OAuth revalidation succeeds. The setup SHALL NOT use the deprecated `/sse` endpoint or the read-only endpoint because the required acceptance flow creates issues.

#### Scenario: Endpoint parity across clients

- **WHEN** the deployed or runtime-owned MCP configuration for all four clients is inspected
- **THEN** every Linear entry SHALL resolve to `https://mcp.linear.app/mcp`
- **AND** no Linear entry SHALL use `https://mcp.linear.app/sse` or `https://mcp.linear.app/mcp/readonly`

### Requirement: Claude Code retains native user-scope Linear registration

The install script SHALL register the `linear` HTTP server through `claude mcp add --scope user --transport http` and SHALL preserve Claude Code's ownership of `~/.claude.json`. Authentication SHALL use Claude Code's supported OAuth flow rather than a stored API key.

#### Scenario: Claude Code registration is present

- **WHEN** the confirmed MCP registration group completes on a machine with Claude Code available
- **THEN** `claude mcp get linear` SHALL report a user-scope HTTP server at `https://mcp.linear.app/mcp`

#### Scenario: Claude Code OAuth completes

- **WHEN** the user runs `claude mcp login linear` or authorizes `linear` from `/mcp`
- **THEN** Claude Code SHALL complete the browser OAuth flow and report the server as connected
- **AND** no OAuth credential SHALL be written to a chezmoi-managed file

### Requirement: OpenCode uses its native remote OAuth transport

The chezmoi-managed OpenCode configuration SHALL define an enabled remote MCP server named `linear` at the official Linear endpoint. Authentication SHALL use OpenCode's native OAuth command and credential store without a local stdio compatibility bridge, package runner, static credential, or managed authentication state.

#### Scenario: OpenCode config is deployed

- **WHEN** `chezmoi apply` deploys `~/.config/opencode/opencode.jsonc`
- **THEN** `mcp.linear` SHALL have type `remote`, be enabled, and set `url` to `https://mcp.linear.app/mcp`
- **AND** the entry SHALL contain no command array, package coordinate, credential, or static header

#### Scenario: OpenCode authenticates natively

- **WHEN** the user runs `opencode mcp auth linear` without an existing Linear grant
- **THEN** OpenCode SHALL initiate the browser OAuth flow and report the remote server as connected after authorization
- **AND** its generated credential state under `~/.local/share/opencode/mcp-auth.json` SHALL remain outside the dotfiles repository

### Requirement: Codex registration is idempotent and runtime-owned

The setup SHALL use the official `codex mcp` CLI and the shared `CODEX_HTTP_MCP_SERVERS` registration module to reconcile a user-level server named `linear` at the official endpoint. It SHALL inspect structured CLI output before mutating state, add a missing entry, repair an entry whose URL differs, and leave a matching entry untouched. The module SHALL NOT invoke `codex mcp login` or manage credentials. Because `codex mcp add` may initiate OAuth immediately, a cancelled or failed add SHALL be followed by a structured re-check: a matching entry that was already written SHALL be preserved and reported with `codex mcp login linear` as the separate user-owned recovery action, while an absent entry SHALL produce a non-fatal warning. The setup SHALL NOT manage the whole `~/.codex/config.toml` file with chezmoi.

#### Scenario: Codex entry is missing

- **WHEN** Codex is available and `codex mcp list --json` has no `linear` entry
- **THEN** the confirmed setup step SHALL run `codex mcp add linear --url https://mcp.linear.app/mcp`
- **AND** if the add exits non-zero after writing the matching entry, the setup SHALL keep it and direct the user to `codex mcp login linear` rather than rolling it back
- **AND** if the entry remains absent, the setup SHALL warn and continue without changing any other Codex entry

#### Scenario: Codex entry already matches

- **WHEN** `codex mcp list --json` reports `linear` at `https://mcp.linear.app/mcp`
- **THEN** the setup SHALL skip registration without rewriting Codex configuration

#### Scenario: Codex OAuth completes

- **WHEN** `codex mcp add` initiates OAuth or the user runs `codex mcp login linear` explicitly
- **THEN** Codex SHALL complete OAuth and retain the grant in Codex-owned runtime state
- **AND** no token SHALL be added to chezmoi source state

### Requirement: Junie configuration is prepared while Linear OAuth remains unsupported

Chezmoi SHALL merge a `linear` remote server at the official endpoint into Junie's user-scope MCP file at `~/.junie/mcp/mcp.json`. The Linear portion of the merge SHALL own only `mcpServers.linear`, preserve all other valid existing configuration except entries managed by separate capabilities, and fail closed without replacing the target with empty or malformed content. The resulting file SHALL contain no API key, bearer token, or static Authorization header. Documentation and parity records SHALL mark Junie as not currently supported because its OAuth token exchange with Linear fails, and SHALL retain the credential-free entry for revalidation with a future Junie release.

#### Scenario: Junie config is deployed

- **WHEN** `chezmoi apply` runs on a machine without Junie MCP configuration
- **THEN** `~/.junie/mcp/mcp.json` SHALL contain `mcpServers.linear.url` equal to `https://mcp.linear.app/mcp`

#### Scenario: Existing Junie servers survive apply

- **WHEN** `~/.junie/mcp/mcp.json` contains valid non-Linear MCP server entries and `chezmoi apply` runs
- **THEN** those entries SHALL remain unchanged while `mcpServers.linear` converges to the managed endpoint

#### Scenario: Junie merge cannot produce valid JSON

- **WHEN** the merge engine is unavailable or cannot produce valid JSON
- **THEN** the live Junie MCP file SHALL remain unchanged, or a valid empty object SHALL be emitted when no live file exists
- **AND** chezmoi SHALL NOT replace it with empty or malformed content

#### Scenario: Junie OAuth limitation is recorded safely

- **WHEN** the user opens `/mcp`, selects the user-scope `linear` server, and chooses Authorize
- **THEN** the current compatibility record SHALL report the reproduced `400 Bad Request` response with `Client must not use multiple authentication methods`
- **AND** Junie SHALL be labelled as not currently supported rather than Active or connected
- **AND** documentation SHALL direct a future Junie release to repeat the controlled OAuth check before enabling functional acceptance
- **AND** documentation SHALL NOT recommend a static token, Authorization header, compatibility bridge, or other credential workaround
- **AND** the managed JSON file SHALL remain free of credentials

### Requirement: Every supported client can list projects and create a dotfiles issue

After authentication, each of Claude Code, OpenCode, and Codex SHALL expose Linear tools that can list workspace projects and create an issue assigned to the existing `dotfiles` project. Verification SHALL discover the project rather than hard-code a workspace-specific project identifier. Junie SHALL be excluded from functional acceptance until a future controlled OAuth check succeeds.

#### Scenario: Project listing works in every supported client

- **WHEN** an authenticated acceptance check asks Claude Code, OpenCode, and Codex to list Linear projects
- **THEN** each supported client SHALL return the workspace project whose name is `dotfiles`

#### Scenario: Issue creation works in every supported client

- **WHEN** an authenticated acceptance check asks Claude Code, OpenCode, or Codex to create a uniquely named disposable issue in the discovered `dotfiles` project
- **THEN** Linear SHALL return the created issue identifier and project association
- **AND** the verification record SHALL identify which client created it so the issue can be closed or cancelled after the check

### Requirement: Setup and authentication are reproducibly documented

Repository documentation SHALL identify the managed surface and support status for all four clients. For Claude Code, OpenCode, and Codex, it SHALL identify the registration or apply command, authentication command or UI, connection-status check, functional acceptance prompts, and credential ownership. For Junie, it SHALL identify the managed credential-free entry, current OAuth incompatibility, reproduced error, and safe revalidation criterion. It SHALL include safe stale-auth recovery paths without instructing users to commit secrets.

#### Scenario: Fresh-machine setup is followed from documentation

- **WHEN** a user starts from a fresh machine, applies the dotfiles, and follows the documented manual authentication steps
- **THEN** Claude Code, OpenCode, and Codex SHALL reach a connected Linear MCP state without editing a project-level agent configuration
- **AND** Junie's user-scope Linear entry SHALL be present and explicitly labelled as not currently supported pending successful OAuth revalidation

#### Scenario: Credentials are never documented as source data

- **WHEN** the README, manual, install output, and managed MCP files are inspected
- **THEN** they SHALL contain no real Linear API key, bearer token, OAuth access token, or refresh token
