## ADDED Requirements

### Requirement: Explicit shell field set to zsh

The `dot_config/opencode/opencode.jsonc` file SHALL contain a top-level `"shell": "zsh"` field. This ensures opencode's agent shell tool resolves to zsh on every machine regardless of OpenCode's per-platform default, so the agent inherits aliases, PATH, and shell functions sourced from `~/.zshrc`.

#### Scenario: Shell field present after fresh setup

- **WHEN** `chezmoi apply` is run on a machine without OpenCode config
- **THEN** the deployed `~/.config/opencode/opencode.jsonc` contains the `"shell": "zsh"` field at the top level

#### Scenario: Agent shell tool uses zsh

- **WHEN** opencode's agent invokes a shell command via the shell tool
- **THEN** the command runs under zsh and resolves user-defined aliases (e.g., `lg`, `gco`) without needing fully-qualified paths

#### Scenario: zshrc-sourced functions available

- **WHEN** the agent shell tool runs a function that is defined in the user's zshrc (e.g., `_tv_ctrl_t_wrapper`)
- **THEN** the function resolves and executes without "command not found" errors
