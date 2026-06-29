## ADDED Requirements

### Requirement: AoE launches claude under the project Node version

AoE-launched claude sessions SHALL pick up the project's Node version through the `claude-node-launch` shim. Because AoE runs the agent in a sandbox with an environment passthrough allowlist (not the user's interactive shell), the AoE config managed by chezmoi SHALL include `NVM_DIR` in its sandbox `environment` passthrough so the shim can resolve the version from the filesystem (`$NVM_DIR/versions/node/`) without needing the `nvm` shell function. AoE SHALL invoke `claude` such that the PATH shim intercepts it — either by preserving the shim's PATH ordering inside the sandbox, or via an agent-command override pointing at the shim if AoE supports one. The exact mechanism SHALL be confirmed by a verification task during implementation.

#### Scenario: NVM_DIR is in the AoE sandbox environment passthrough

- **WHEN** the AoE `config.toml` is rendered by chezmoi
- **THEN** the sandbox `environment` passthrough list names `NVM_DIR` (in addition to the existing `CLAUDE_CONFIG_DIR`, `EDITOR`, `TERM`, `COLORTERM`)

#### Scenario: AoE-launched claude uses the project Node

- **WHEN** a worktree pinned to a non-default Node version (via `.nvmrc`) is launched as an AoE session
- **THEN** the claude process started by AoE, and its subprocesses, resolve the project's pinned Node version rather than the nvm default
