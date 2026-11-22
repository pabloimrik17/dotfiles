# Spec Delta

## MODIFIED Requirements

### Requirement: The gws OAuth client file is age-encrypted and deployed by chezmoi

The source tree SHALL contain `dot_config/private_gws/encrypted_private_client_secret.json.age`. On `chezmoi apply`, chezmoi SHALL decrypt it with the age identity at `~/.config/chezmoi/key.txt` and write the plaintext to `~/.config/gws/client_secret.json` with mode 600, creating `~/.config/gws/` when it does not exist and keeping it at mode 700, on every machine whatever its machine type. The `private_` prefix on the source directory sets that mode, which `gws` also uses for its `credentials.enc` and `token_cache.json`. The plaintext is the Desktop app OAuth client JSON the user downloads from their own Google Cloud project, and this repository SHALL NOT restate, template or default any of its fields.

The file SHALL be committed only as age ciphertext, because the repository is public and the client JSON names the user's own GCP project and carries a client secret. No plaintext copy, plaintext template, `create_` or `modify_` variant or placeholder SHALL exist for that path. The chezmoi source SHALL hold no file that targets the refresh token or the encrypted credentials `gws` writes after login. The refresh token SHALL stay in `gws`'s own encrypted store, with its encryption key in the macOS Keychain, and SHALL NOT be written to the repository in any form.

Chezmoi SHALL treat the content as opaque: it decrypts and writes it without parsing it. The dotfiles SHALL add no apply-time validation of it.

The path `~/.config/gws/client_secret.json` SHALL be confirmed against the pinned `gws` before the encrypted file is created, and the spec SHALL be read as naming where `gws` reads its client configuration at the declared version.

#### Scenario: Client file deployed on chezmoi apply

- **WHEN** `chezmoi apply` runs on a host with a valid `~/.config/chezmoi/key.txt`
- **THEN** chezmoi decrypts `dot_config/private_gws/encrypted_private_client_secret.json.age` and writes the plaintext to `~/.config/gws/client_secret.json` with mode 600

#### Scenario: Apply fails loudly without the identity

- **WHEN** `chezmoi apply` runs and `~/.config/chezmoi/key.txt` is missing or unreadable
- **THEN** chezmoi reports a decryption failure that names the encrypted file or `client_secret.json`
- **AND** it does not overwrite or create `~/.config/gws/client_secret.json`

#### Scenario: Repository content is opaque

- **WHEN** the repository is browsed on GitHub or cloned without the identity
- **THEN** `encrypted_private_client_secret.json.age` is the only Google OAuth artifact in the source tree, its bytes are age ciphertext, and no tracked file contains an OAuth client ID, client secret or token

#### Scenario: No token is managed

- **WHEN** the chezmoi source tree is searched for paths that target `~/.config/gws/`
- **THEN** the only match is `encrypted_private_client_secret.json.age`

#### Scenario: Config directory stays 0700

- **WHEN** `chezmoi apply` runs and `~/.config/gws/` exists with mode 700
- **THEN** its mode is still 700 afterwards
