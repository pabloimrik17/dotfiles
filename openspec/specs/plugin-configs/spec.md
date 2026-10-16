# plugin-configs Specification

## Purpose

Delivers the per-user configuration files of Claude Code plugins (`autonomous`, `stonks`) to every machine as age-encrypted chezmoi files, so the plugins find their configuration without its personal values ever appearing in clear text in this public repository.

## Requirements

### Requirement: Plugin configuration files are always age-encrypted

Every per-user configuration file of a Claude Code plugin that this repository manages SHALL be committed only as an age-encrypted chezmoi source file whose name starts with `encrypted_private_` and ends with `.age`. The rule SHALL apply whatever the file contains, including a file that holds no credentials, because this repository and the plugin repositories are public and the files hold personal values. An encrypted template SHALL retain both encryption and private-file attributes; its template contents SHALL remain inside the age ciphertext. The repository SHALL NOT contain a plaintext copy of a plugin configuration, a plaintext template that holds or renders plugin configuration values, or a placeholder or example file deployed to a plugin's configuration path.

#### Scenario: A configuration without credentials is still encrypted

- **WHEN** a plugin configuration file holds no credentials (as `~/.config/autonomous/config.json` does under the `autonomous.config.v1` contract)
- **THEN** its only representation in the source tree is an `encrypted_private_*.age` file

#### Scenario: Repository content is opaque

- **WHEN** the repository is browsed on GitHub or cloned without the age identity
- **THEN** `dot_config/autonomous/` contains only `encrypted_private_config.json.tmpl.age` and `dot_config/stonks/` contains only `encrypted_private_config.json.age`, both contain age ciphertext, and no tracked file contains a value from either decrypted configuration

#### Scenario: No plaintext variant exists

- **WHEN** the source tree is searched for files whose target is `~/.config/autonomous/config.json` or `~/.config/stonks/config.json`
- **THEN** the only matches are `dot_config/autonomous/encrypted_private_config.json.tmpl.age` and `dot_config/stonks/encrypted_private_config.json.age`, with no plaintext file, plaintext template, `create_` or `modify_` variant

### Requirement: The autonomous configuration is deployed to ~/.config/autonomous/config.json

The source tree SHALL contain `dot_config/autonomous/encrypted_private_config.json.tmpl.age`. On `chezmoi apply`, chezmoi SHALL decrypt it with the age identity at `~/.config/chezmoi/key.txt`, render the decrypted template using the applying machine's chezmoi data, and write the resulting plaintext to `~/.config/autonomous/config.json` with mode 600, on every machine whatever its machine type. The plaintext SHALL be a configuration in the `autonomous` plugin's format, identified by `schema: "autonomous.config.v1"`. The plugin's `config.example.json` and configuration loader define that format, and this repository SHALL NOT restate or default any of its fields. The managed file SHALL be at the plugin's default path: the dotfiles SHALL NOT export `AUTONOMOUS_CONFIG` or any other variable that points the plugin at another file.

#### Scenario: Apply with the identity

- **WHEN** `chezmoi apply` runs on a host with a valid `~/.config/chezmoi/key.txt`
- **THEN** `~/.config/autonomous/config.json` exists with mode 600 and holds the rendered configuration as valid JSON

#### Scenario: Existing loose permissions are tightened

- **WHEN** `~/.config/autonomous/config.json` already exists with a mode wider than 600 and `chezmoi apply` runs
- **THEN** the file ends with mode 600

#### Scenario: The plugin reads the managed file

- **WHEN** the `autonomous` plugin loads its configuration after `chezmoi apply` in a shell started from the managed dotfiles
- **THEN** it resolves `~/.config/autonomous/config.json`, because no managed file sets `AUTONOMOUS_CONFIG`

#### Scenario: Existing configuration values survive template conversion

- **WHEN** the existing autonomous configuration is converted to an encrypted template and rendered
- **THEN** every JSON value except the home-dependent Beads directory retains its previous value, including any literal template delimiters in unrelated strings

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

A deleted target SHALL be restored from the encrypted source on the next `chezmoi apply` once the user confirms chezmoi's overwrite prompt for a target changed since its last write, or with `--force`. When the encrypted source of a plugin configuration is absent from the source tree, chezmoi SHALL NOT manage that path: it SHALL write nothing there and SHALL leave any unmanaged file at that path untouched. A file deployed before the source was removed stays, and the plugin keeps reading it. When no file exists at that path, the plugin reports its own missing-file error. The dotfiles SHALL NOT deploy the plugin's `config.example.json`, an empty file, or any default in its place.

#### Scenario: Deleted target is restored

- **WHEN** `~/.config/stonks/config.json` is deleted and `chezmoi apply` runs with the identity
- **THEN** chezmoi asks before overwriting the changed target, and answering `overwrite`, or running with `--force`, writes the file again from `dot_config/stonks/encrypted_private_config.json.age` with mode 600

#### Scenario: Source absent, nothing is deployed

- **WHEN** the source tree has no `dot_config/stonks/encrypted_private_config.json.age`, `~/.config/stonks/config.json` does not exist, and `chezmoi apply` runs
- **THEN** chezmoi does not create `~/.config/stonks/config.json`, and running the plugin reports the plugin's own missing-configuration error naming the path

#### Scenario: Removed source leaves the deployed file

- **WHEN** `dot_config/stonks/encrypted_private_config.json.age` is removed after `~/.config/stonks/config.json` was deployed, and `chezmoi apply` runs
- **THEN** chezmoi leaves `~/.config/stonks/config.json` untouched, and the plugin keeps reading it

### Requirement: Configuration validity is the plugin's concern, not chezmoi's

chezmoi SHALL decrypt plugin configurations, render sources marked as templates, and write the resulting content without parsing or validating it against the plugin's schema. The dotfiles SHALL NOT add a script, template check or hook that validates a plugin configuration during `chezmoi apply`. Provided decryption and any template rendering succeed, a deployed file that fails the plugin's strict validation (a missing, mistyped or unknown field, invalid JSON, or a schema id the installed plugin version does not accept) SHALL be reported by the plugin when it loads its configuration, as an error naming the path, and SHALL NOT make `chezmoi apply` fail. The correction is made in the encrypted source through the documented edit flow.

#### Scenario: An invalid configuration does not fail apply

- **WHEN** the rendered or decrypted content of a plugin configuration would fail that plugin's schema, decryption and any template rendering succeed, and `chezmoi apply` runs with the identity
- **THEN** apply succeeds and writes the file with mode 600

#### Scenario: The plugin reports the invalid configuration

- **WHEN** the `autonomous` plugin loads a deployed `~/.config/autonomous/config.json` that does not match `autonomous.config.v1`
- **THEN** the plugin reports an error naming `~/.config/autonomous/config.json` and the failing field, and chezmoi has reported no plugin-schema validation error for that file

#### Scenario: A plugin schema bump is fixed in the source

- **WHEN** a new plugin version stops accepting the schema id of the deployed file
- **THEN** the user updates the configuration with `chezmoi edit ~/.config/<plugin>/config.json`, commits the re-encrypted source, and the next `chezmoi apply` on each machine deploys the updated file

#### Scenario: Rendering errors remain chezmoi errors

- **WHEN** the encrypted autonomous source decrypts successfully but contains invalid template syntax
- **THEN** chezmoi reports the rendering failure and exits non-zero rather than deploying the unresolved template

### Requirement: The plugin configuration edit flow is documented

The README SHALL document creating and editing a plugin configuration: `chezmoi edit ~/.config/<plugin>/config.json`, which re-encrypts the source on save, followed by a commit of the `.age` file and `chezmoi update` on every machine. It SHALL also state that plugin configurations are always encrypted. The "Encrypted files (chezmoi + age)" table in `docs/manual.html` SHALL list `~/.config/autonomous/config.json` and `~/.config/stonks/config.json` with the same flow.

#### Scenario: README covers plugin configurations

- **WHEN** the README's daily-workflow section on encrypted files is read
- **THEN** it names both plugin configuration paths, the `chezmoi edit` flow, and the always-encrypted rule

#### Scenario: Manual covers plugin configurations

- **WHEN** the "Encrypted files (chezmoi + age)" table in `docs/manual.html` is read
- **THEN** it lists both plugin configuration paths with the `chezmoi edit` flow

#### Scenario: Manual identifies the correct encrypted sources

- **WHEN** the manual's plugin configuration edit flow is read
- **THEN** it identifies `dot_config/autonomous/encrypted_private_config.json.tmpl.age` for autonomous and `dot_config/stonks/encrypted_private_config.json.age` for stonks
- **AND** it explains that autonomous is an encrypted template whose Beads path derives from the applying machine's home, and edits must preserve that expression

#### Scenario: Per-machine acceptance is documented

- **WHEN** the user follows the autonomous verification instructions on a machine with its age identity
- **THEN** the instructions check the rendered Beads path against that machine's home, verify that the directory exists, apply the configuration, and check that the target has no remaining chezmoi diff
- **AND** a missing Beads directory is identified as an unmet machine prerequisite rather than silently created

### Requirement: The autonomous Beads directory follows the applying machine's home

The autonomous encrypted template SHALL derive `sources.beads.directory` from `.chezmoi.homeDir` with the suffix `/WebstormProjects/agentic-task`. Rendering SHALL produce an absolute JSON string for that machine. Dotfiles SHALL NOT create or clone the Beads repository or add an apply-time directory-existence validator; acceptance on each machine SHALL include an explicit check that the rendered directory exists.

#### Scenario: Different users receive different absolute paths

- **WHEN** the same encrypted source is rendered on two machines with different home directories
- **THEN** each rendered `sources.beads.directory` equals its own home followed by `/WebstormProjects/agentic-task`, with no dependency on the source author's home

#### Scenario: Homes containing spaces are supported

- **WHEN** the applying machine's home contains spaces
- **THEN** the rendered configuration remains valid JSON and the complete home path is preserved in `sources.beads.directory`

#### Scenario: Successful deployment is idempotent

- **WHEN** the rendered Beads directory exists and the autonomous configuration is applied with a valid identity
- **THEN** a subsequent chezmoi diff for `~/.config/autonomous/config.json` is empty

#### Scenario: Missing repository remains an acceptance failure

- **WHEN** the configured Beads directory does not exist on the machine
- **THEN** the explicit acceptance check fails and reports the unmet prerequisite
- **AND** chezmoi does not create an empty repository directory or fail solely because that directory is absent
