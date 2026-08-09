# Delta: zsh-secrets

## Purpose

Provides a single age-encrypted file, deployed by chezmoi and sourced by the interactive shell, that exports API tokens and other per-user secrets into the environment so tools launched from the terminal can read them without any plaintext secret being committed to the dotfiles repository.

## ADDED Requirements

### Requirement: Encrypted secrets file is managed by chezmoi

The repository SHALL contain `encrypted_private_dot_config/zsh/secrets.zsh.age`, which chezmoi decrypts and deploys to `~/.config/zsh/secrets.zsh` with owner-only permissions (`0600`), using the same age backend already configured for `encrypted_dot_ticker.yaml.age`.

The file SHALL contain only `export NAME=value` assignments. No plaintext copy of the file, and no secret value it carries, SHALL exist anywhere in the repository.

#### Scenario: Deployed on a host holding the age identity

- **WHEN** `chezmoi apply` runs on a machine where `~/.config/chezmoi/key.txt` is present
- **THEN** `~/.config/zsh/secrets.zsh` SHALL exist with mode `0600`
- **AND** its contents SHALL match the decrypted source file

#### Scenario: Repository carries no plaintext

- **WHEN** the repository is inspected at any commit
- **THEN** no unencrypted `secrets.zsh` (or equivalent plaintext token file) SHALL be tracked
- **AND** the only committed form SHALL be the `.age` ciphertext

#### Scenario: Host without the age identity

- **WHEN** `chezmoi apply` runs on a machine that does not hold the age private key
- **THEN** the encrypted secrets file SHALL fail to decrypt in the same way as every other `encrypted_*.age` file in the repo, and the bootstrap procedure documented for `chezmoi-encryption` (copy the private key before the first apply) SHALL apply unchanged

### Requirement: Interactive shell sources the secrets file when present

`dot_zshrc.tmpl` SHALL source `~/.config/zsh/secrets.zsh` guarded by an existence test, following the `[[ -f <path> ]] && source <path>` idiom already used for the Catppuccin syntax-highlighting theme. The guard SHALL make a missing file a no-op rather than an error.

#### Scenario: Secrets available in a new shell

- **WHEN** `~/.config/zsh/secrets.zsh` exists and a new interactive zsh session starts
- **THEN** every variable exported by that file SHALL be present in the session environment
- **AND** SHALL be inherited by processes started from that session

#### Scenario: Missing secrets file does not break the shell

- **WHEN** `~/.config/zsh/secrets.zsh` does not exist and a new interactive zsh session starts
- **THEN** the shell SHALL start with no error output and no `no such file or directory` message

#### Scenario: Secret values are never echoed

- **WHEN** the shell sources the secrets file
- **THEN** no secret value SHALL be printed to the terminal or written to any log or history file

### Requirement: Slack MCP token is delivered through the secrets file

`SLACK_MCP_TOKEN` SHALL be exported from `~/.config/zsh/secrets.zsh` and SHALL hold a Slack user token (`xoxp-` prefix) issued by a workspace app carrying the scopes the Slack MCP server requires. It SHALL NOT be defined inline in `dot_zshrc.tmpl`, in any chezmoi template, or in any OpenCode or Claude Code configuration file.

#### Scenario: Token reaches an MCP client

- **WHEN** an MCP client is launched from an interactive shell on a host where the secrets file exports `SLACK_MCP_TOKEN`
- **THEN** the client SHALL resolve `SLACK_MCP_TOKEN` from the environment

#### Scenario: Token absent degrades gracefully

- **WHEN** `SLACK_MCP_TOKEN` is unset or empty
- **THEN** consumers SHALL start normally, the Slack MCP connection SHALL be the only thing that fails, and no other server or shell feature SHALL be affected

#### Scenario: Token is not hardcoded

- **WHEN** `dot_zshrc.tmpl`, `dot_config/opencode/opencode.jsonc`, `dot_claude/settings.json.tmpl`, and `run_onchange_install-packages.sh.tmpl` are inspected
- **THEN** each SHALL reference `SLACK_MCP_TOKEN` only by name (or via an `{env:…}` placeholder) and never contain a literal token value
