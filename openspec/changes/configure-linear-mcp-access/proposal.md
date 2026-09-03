## Why

Linear is already registered for Claude Code, but the dotfiles do not provide equivalent user-level access for OpenCode or Codex, and the existing documentation does not describe a reproducible multi-client authentication and verification flow. Junie can be preconfigured with the official Linear endpoint, but its current OAuth implementation is incompatible with Linear. A shared contract is needed so each currently supported coding agent can work with the same Linear workspace without versioning credentials, while the Junie limitation remains visible and easy to revisit.

## What Changes

- Keep Claude Code on Linear's official Streamable HTTP endpoint and make its user-scope OAuth setup and verification explicit.
- Add a user-level OpenCode Linear server through its native remote MCP transport and supported OAuth flow, with OAuth state kept outside the repository.
- Register Linear idempotently through Codex's official `codex mcp` CLI without managing the whole Codex config file, and document that `codex mcp add` may initiate OAuth while `codex mcp login linear` remains the explicit authentication and recovery path.
- Add a merge-preserving chezmoi modifier for Junie's user-scope MCP configuration that prepares the official Linear endpoint while preserving unrelated servers.
- Record the four-client mapping in the agent-config parity table, with Junie explicitly marked as not currently supported because its OAuth token exchange fails against Linear.
- Document setup, authentication, troubleshooting, and acceptance checks for Claude Code, OpenCode, and Codex, including listing Linear projects and creating a disposable issue in the `dotfiles` project. Document the reproduced Junie limitation and a safe future revalidation path without adding a compatibility bridge.
- Keep Linear tokens, API keys, OAuth grants, and generated client state out of version control.

## Capabilities

### New Capabilities

- `linear-mcp-access`: User-level Linear MCP registration, authentication, credential ownership, and functional verification across Claude Code, OpenCode, and Codex, plus credential-free Junie preconfiguration with an explicit compatibility gap and revalidation path.

### Modified Capabilities

- `codex-install`: Extend the installed Codex lifecycle with an idempotent, runtime-owned Linear MCP registration and its documented authentication workflow.
- `update-manual-skill`: Route Junie user configuration changes to a dedicated manual section and include Junie in agent-configuration documentation analysis.
- `manual-web`: Document the three supported Linear client flows, mark Junie as not currently supported, and add Junie to the ordered manual sections while retaining Agent Sessions as the final section.
- `manual-print`: Include the added Junie section and updated section count in the printable manual.
- `readme-content`: List the newly managed Junie configuration, describe reproducible setup and authentication for the three supported clients, and expose Junie's current OAuth limitation.

## Impact

- Configuration and registration surfaces: `run_onchange_install-packages.sh.tmpl`, `dot_config/opencode/opencode.jsonc`, a new `dot_junie/mcp/modify_mcp.json.tmpl`, and `.agents/skills/sync-agent-config/parity.md`.
- Dependency automation: no package pin, Renovate manager, global install, or `update-extra` step is added for OpenCode's native remote transport.
- Documentation: `README.md`, `docs/manual.html`, and the update-manual skill mapping.
- Runtime-owned state remains outside chezmoi: Claude Code writes `~/.claude.json`, Codex writes `~/.codex/config.toml`, and each functional client keeps OAuth credentials in its own local store. Junie's managed Linear entry remains credential-free.
