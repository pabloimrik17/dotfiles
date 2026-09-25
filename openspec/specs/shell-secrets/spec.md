# shell-secrets Specification

## Purpose

Delivers secret environment variables (API keys) to interactive zsh on every machine through a single age-encrypted file managed by chezmoi. Plaintext never enters the public repository.

## Requirements

### Requirement: Secrets file is age-encrypted and deployed with mode 600

The source tree SHALL contain `dot_config/zsh/encrypted_private_secrets.zsh.age`. On `chezmoi apply`, chezmoi SHALL decrypt it with the age identity at `~/.config/chezmoi/key.txt` and write `~/.config/zsh/secrets.zsh` with mode 600. The file's plaintext SHALL NOT be committed.

#### Scenario: Apply with identity

- **WHEN** `chezmoi apply` runs on a host with a valid `~/.config/chezmoi/key.txt`
- **THEN** `~/.config/zsh/secrets.zsh` exists with mode 600 and holds the decrypted exports

#### Scenario: Apply without identity

- **WHEN** `~/.config/chezmoi/key.txt` is missing or unreadable
- **THEN** chezmoi reports a decryption failure for the file and does not write a plaintext secrets file

#### Scenario: Repository is opaque

- **WHEN** the repository is browsed without the identity
- **THEN** the secrets file is present only as age ciphertext, and no tracked file contains the value of any exported secret

### Requirement: Secrets file contains only export statements

The decrypted file SHALL consist of `export NAME=value` lines, blank lines, and comments. It SHALL NOT run commands, define functions, or print output. It SHALL export `TYPESAFE_API_KEY`.

#### Scenario: TypeSafe key available

- **WHEN** a new interactive zsh starts after apply
- **THEN** `TYPESAFE_API_KEY` is set and not empty

#### Scenario: Sourcing is silent

- **WHEN** the file is sourced
- **THEN** it writes nothing to stdout or stderr

### Requirement: zshrc sources the secrets file when present

`dot_zshrc.tmpl` SHALL source `$XDG_CONFIG_HOME/zsh/secrets.zsh` only when the file exists and is readable, so a shell never fails because the file is missing.

#### Scenario: File present

- **WHEN** an interactive zsh starts and the file exists
- **THEN** its exports are in the shell environment and inherited by agents launched from it

#### Scenario: File absent

- **WHEN** an interactive zsh starts and the file does not exist
- **THEN** the shell starts normally with no error and no secret variables set
