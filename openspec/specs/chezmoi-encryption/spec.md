# Capability: chezmoi-encryption

## Purpose

age-based encryption convention for chezmoi-managed secrets in this repository — public recipient committed, per-host private identity, documented bootstrap flow.

## Requirements

### Requirement: age is the encryption backend for this repository

The chezmoi configuration in `.chezmoi.toml.tmpl` SHALL set `encryption = "age"` so that any file in the source tree whose name begins with `encrypted_` and ends with `.age` is decrypted on `chezmoi apply` and re-encrypted on `chezmoi re-add --encrypt`. The repository SHALL NOT use gpg encryption.

#### Scenario: Encryption setting is committed

- **WHEN** `.chezmoi.toml.tmpl` is rendered on any host
- **THEN** the resulting `~/.config/chezmoi/chezmoi.toml` sets `encryption = "age"` at the top level

#### Scenario: gpg backend is not configured

- **WHEN** `.chezmoi.toml.tmpl` is read
- **THEN** the file does not contain a `[gpg]` block or any `gpg.recipient`, `gpg.symmetric`, or `encryption = "gpg"` setting

### Requirement: The age recipient is committed and the identity is per-host

The `.chezmoi.toml.tmpl` SHALL contain an `[age]` block declaring `identity = "~/.config/chezmoi/key.txt"` and `recipient = "<the user's age public key, age1... string>"`. The recipient is an X25519 public key and is safe to commit. The private key file at `~/.config/chezmoi/key.txt` SHALL NEVER be committed: it is per-host, generated once by the user, and copied manually to each subsequent machine before `chezmoi apply` is run there.

#### Scenario: Recipient is present in the template

- **WHEN** `.chezmoi.toml.tmpl` is rendered
- **THEN** the resulting config contains an `[age]` table with both `identity` and `recipient` set

#### Scenario: Identity file is not committed

- **WHEN** the repository tree is inspected
- **THEN** no file at any path matching `key.txt`, `*.age.key`, `chezmoi.toml` (outside `.chezmoi.toml.tmpl`), or any directory under `.config/chezmoi/` is committed

#### Scenario: Identity file permissions are restrictive on the host

- **WHEN** the user generates the identity via `age-keygen -o ~/.config/chezmoi/key.txt`
- **THEN** the file is created with mode 600 (or tightened to 600 immediately afterwards via the documented bootstrap step)

### Requirement: Encrypted files use the chezmoi naming convention

Encrypted files in the source tree SHALL use the chezmoi naming convention: a filename prefix of `encrypted_` and a filename suffix of `.age`. chezmoi resolves the target path by stripping the prefix, applying the standard `dot_` translation if present, and stripping the `.age` suffix. The repository SHALL NOT use any custom encryption scheme or rename-on-deploy logic outside this convention.

#### Scenario: Encrypted ticker config follows the naming convention

- **WHEN** the source tree is inspected
- **THEN** the file at `encrypted_dot_ticker.yaml.age` exists and chezmoi maps it to the target `~/.ticker.yaml`

### Requirement: Bootstrap flow is documented in README and manual

The repository documentation (README and `docs/manual.html`) SHALL include, in a conspicuous block, a bootstrap procedure for the age identity covering: (a) generating the keypair with `age-keygen -o ~/.config/chezmoi/key.txt`, (b) backing up the resulting private key file to a password manager **immediately** after generation, (c) copying the private key file to `~/.config/chezmoi/key.txt` on every new machine before the first `chezmoi apply`, and (d) the warning that losing the private key without a backup makes any committed `.age` file unrecoverable.

#### Scenario: README explains the bootstrap

- **WHEN** the README is read
- **THEN** a section describes how to generate, back up, and propagate the age private key to new machines

#### Scenario: Manual covers the same bootstrap

- **WHEN** `docs/manual.html` is rendered
- **THEN** the same bootstrap procedure (or a link to a single canonical block) is present
