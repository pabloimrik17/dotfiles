## Purpose

Delivers the per-user configuration files of Claude Code plugins (`autonomous`, `stonks`) to every machine as age-encrypted chezmoi files, so the plugins find their configuration without its personal values ever appearing in clear text in this public repository.

## ADDED Requirements

### Requirement: Plugin configuration files are always age-encrypted

Every per-user configuration file of a Claude Code plugin that this repository manages SHALL be committed only as an age-encrypted chezmoi source file whose name starts with `encrypted_private_` and ends with `.age`. The rule SHALL apply whatever the file contains, including a file that holds no credentials, because this repository and the plugin repositories are public and the files hold personal values. The repository SHALL NOT contain a plaintext copy of a plugin configuration, a plaintext template that holds or renders plugin configuration values, or a placeholder or example file deployed to a plugin's configuration path.

#### Scenario: A configuration without credentials is still encrypted

- **WHEN** a plugin configuration file holds no credentials (as `~/.config/autonomous/config.json` does under the `autonomous.config.v1` contract)
- **THEN** its only representation in the source tree is an `encrypted_private_*.age` file

#### Scenario: Repository content is opaque

- **WHEN** the repository is browsed on GitHub or cloned without the age identity
- **THEN** `dot_config/autonomous/` and `dot_config/stonks/` each contain only `encrypted_private_config.json.age`, its bytes are age ciphertext, and no tracked file contains a value from either decrypted configuration

#### Scenario: No plaintext variant exists

- **WHEN** the source tree is searched for files whose target is `~/.config/autonomous/config.json` or `~/.config/stonks/config.json`
- **THEN** the only matches are the two `encrypted_private_config.json.age` files, with no plaintext file, plaintext template, `create_` or `modify_` variant

### Requirement: The autonomous configuration is deployed to ~/.config/autonomous/config.json

The source tree SHALL contain `dot_config/autonomous/encrypted_private_config.json.age`. On `chezmoi apply`, chezmoi SHALL decrypt it with the age identity at `~/.config/chezmoi/key.txt` and write the plaintext to `~/.config/autonomous/config.json` with mode 600, on every machine whatever its machine type. The plaintext SHALL be a configuration in the `autonomous` plugin's format, identified by `schema: "autonomous.config.v1"`. The plugin's `config.example.json` and configuration loader define that format, and this repository SHALL NOT restate or default any of its fields. The managed file SHALL be at the plugin's default path: the dotfiles SHALL NOT export `AUTONOMOUS_CONFIG` or any other variable that points the plugin at another file.

#### Scenario: Apply with the identity

- **WHEN** `chezmoi apply` runs on a host with a valid `~/.config/chezmoi/key.txt`
- **THEN** `~/.config/autonomous/config.json` exists with mode 600 and holds the decrypted configuration

#### Scenario: Existing loose permissions are tightened

- **WHEN** `~/.config/autonomous/config.json` already exists with a mode wider than 600 and `chezmoi apply` runs
- **THEN** the file ends with mode 600

#### Scenario: The plugin reads the managed file

- **WHEN** the `autonomous` plugin loads its configuration after `chezmoi apply` in a shell started from the managed dotfiles
- **THEN** it resolves `~/.config/autonomous/config.json`, because no managed file sets `AUTONOMOUS_CONFIG`

### Requirement: The stonks configuration is deployed to ~/.config/stonks/config.json

The source tree SHALL contain `dot_config/stonks/encrypted_private_config.json.age`. On `chezmoi apply`, chezmoi SHALL decrypt it with the age identity at `~/.config/chezmoi/key.txt` and write the plaintext to `~/.config/stonks/config.json` with mode 600, creating `~/.config/stonks/` when it does not exist, on every machine whatever its machine type. The plaintext SHALL be a configuration in the `stonks` plugin's format, declaring the schema id that the plugin's `config.example.json` declares. That example and the plugin's configuration loader, defined by the `daily-agentic-task-force` change `add-stonks-plugin`, are the contract for the format, and this repository SHALL NOT restate or default any of its fields.

#### Scenario: Apply with the identity

- **WHEN** `chezmoi apply` runs on a host with a valid `~/.config/chezmoi/key.txt`
- **THEN** `~/.config/stonks/config.json` exists with mode 600 and holds the decrypted configuration

#### Scenario: The directory is created on a fresh machine

- **WHEN** `~/.config/stonks/` does not exist and `chezmoi apply` runs with the identity
- **THEN** the directory is created and `~/.config/stonks/config.json` is written inside it with mode 600

#### Scenario: The file declares the plugin's schema id

- **WHEN** the decrypted `~/.config/stonks/config.json` is compared with the stonks plugin's `config.example.json`
- **THEN** both declare the same schema id

### Requirement: Apply without the age identity fails loudly

When `~/.config/chezmoi/key.txt` is missing or unreadable, `chezmoi apply` SHALL report a decryption failure that names the plugin configuration file it could not decrypt and SHALL exit non-zero. It SHALL NOT write a plaintext plugin configuration, and it SHALL NOT overwrite, truncate or delete an existing `~/.config/<plugin>/config.json`.

#### Scenario: Missing identity on a new machine

- **WHEN** `chezmoi apply` runs on a host without `~/.config/chezmoi/key.txt`
- **THEN** chezmoi reports a decryption failure naming the plugin configuration file, exits non-zero, and does not create `~/.config/autonomous/config.json` or `~/.config/stonks/config.json`

#### Scenario: Unreadable identity keeps the previous file

- **WHEN** `~/.config/chezmoi/key.txt` is unreadable and `~/.config/autonomous/config.json` already exists
- **THEN** chezmoi reports the decryption failure and the existing file is left byte-for-byte unchanged

### Requirement: Missing files are recovered by apply or reported by the plugin

A deleted target SHALL be restored from the encrypted source on the next `chezmoi apply`. When the encrypted source of a plugin configuration is absent from the source tree, chezmoi SHALL NOT manage that path: it SHALL write nothing there and SHALL leave any unmanaged file at that path untouched. In that case the plugin reports its own missing-file error. The dotfiles SHALL NOT deploy the plugin's `config.example.json`, an empty file, or any default in its place.

#### Scenario: Deleted target is restored

- **WHEN** `~/.config/stonks/config.json` is deleted and `chezmoi apply` runs with the identity
- **THEN** the file is written again from `dot_config/stonks/encrypted_private_config.json.age` with mode 600

#### Scenario: Source absent, nothing is deployed

- **WHEN** the source tree has no `dot_config/stonks/encrypted_private_config.json.age` and `chezmoi apply` runs
- **THEN** chezmoi neither creates nor modifies `~/.config/stonks/config.json`, and running the plugin reports the plugin's own missing-configuration error naming the path

### Requirement: Configuration validity is the plugin's concern, not chezmoi's

chezmoi SHALL treat the decrypted plugin configuration as opaque content: it SHALL decrypt and write it without parsing or validating it against the plugin's schema. The dotfiles SHALL NOT add a script, template check or hook that validates a plugin configuration during `chezmoi apply`. A deployed file that fails the plugin's strict validation (a missing, mistyped or unknown field, invalid JSON, or a schema id the installed plugin version does not accept) SHALL be reported by the plugin when it loads its configuration, as an error naming the path, and SHALL NOT make `chezmoi apply` fail. The correction is made in the encrypted source through the documented edit flow.

#### Scenario: An invalid configuration does not fail apply

- **WHEN** the decrypted content of a plugin configuration would fail that plugin's schema and `chezmoi apply` runs with the identity
- **THEN** apply succeeds and writes the file with mode 600

#### Scenario: The plugin reports the invalid configuration

- **WHEN** the `autonomous` plugin loads a deployed `~/.config/autonomous/config.json` that does not match `autonomous.config.v1`
- **THEN** the plugin reports an error naming `~/.config/autonomous/config.json` and the failing field, and chezmoi has reported nothing for that file

#### Scenario: A plugin schema bump is fixed in the source

- **WHEN** a new plugin version stops accepting the schema id of the deployed file
- **THEN** the user updates the configuration with `chezmoi edit ~/.config/<plugin>/config.json`, commits the re-encrypted source, and the next `chezmoi apply` on each machine deploys the updated file

### Requirement: The plugin configuration edit flow is documented

The README SHALL document creating and editing a plugin configuration: `chezmoi edit ~/.config/<plugin>/config.json`, which re-encrypts the source on save, followed by a commit of the `.age` file and `chezmoi update` on every machine. It SHALL also state that plugin configurations are always encrypted. The "Encrypted files (chezmoi + age)" table in `docs/manual.html` SHALL list `~/.config/autonomous/config.json` and `~/.config/stonks/config.json` with the same flow.

#### Scenario: README covers plugin configurations

- **WHEN** the README's daily-workflow section on encrypted files is read
- **THEN** it names both plugin configuration paths, the `chezmoi edit` flow, and the always-encrypted rule

#### Scenario: Manual covers plugin configurations

- **WHEN** the "Encrypted files (chezmoi + age)" table in `docs/manual.html` is read
- **THEN** it lists both plugin configuration paths with the `chezmoi edit` flow
