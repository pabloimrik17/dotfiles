# Capability: googleworkspace-cli-install

## Purpose

Installs the Google Workspace CLI (`gws`) through Homebrew, frozen at a declared version, so the `stonks` plugin can read the user's tracking sheet with read-only access on every macOS host. Also deploys the user's Google OAuth client file from an age-encrypted source, and prints the Google Cloud setup it needs, without any Google credential appearing in clear text in the repository.

## ADDED Requirements

### Requirement: gws is a frozen Homebrew formula from homebrew/core

The macOS branch of the install script SHALL install the Google Workspace CLI as the formula `googleworkspace-cli` in `BREW_PACKAGES`. The formula comes from `homebrew/core`, so it SHALL need no `BREW_TAPS` entry. `pkg_bin` SHALL map the formula to the `gws` binary, so the pre-scan finds an installed copy.

`BREW_VERSIONS` SHALL declare `googleworkspace-cli|0.22.5`. The freeze SHALL pin the formula and report drift from that row as it does for every frozen package (see `brew-version-pins`). `googleworkspace-cli` SHALL NOT be a declared hold: a hold does not install a missing package, and a fresh host needs `gws`.

After install, `gws` SHALL resolve on `PATH` from Homebrew's prefix. That binary is the contract the `stonks` plugin relies on: it calls `gws` by name and never through a path inside this repository.

#### Scenario: Fresh macOS host installs and pins gws

- **WHEN** the install script runs on a macOS host without `gws` and the user accepts the brew packages group
- **THEN** the script installs `googleworkspace-cli` and pins it in the same run
- **AND** `command -v gws` resolves under `$(brew --prefix)/bin`

#### Scenario: An installed gws is not reinstalled

- **WHEN** the pre-scan runs on a host where `gws` is on PATH
- **THEN** it counts `googleworkspace-cli` as installed and installs nothing for it

#### Scenario: The declared version is recorded

- **WHEN** `BREW_VERSIONS` is read
- **THEN** it holds exactly one row for the formula, `googleworkspace-cli|0.22.5`, in alphabetical position

#### Scenario: A newer formula release is reported, not installed over

- **WHEN** the pinned `googleworkspace-cli` differs from its declared version
- **THEN** the script warns with both versions and makes no install, upgrade or uninstall call for it

#### Scenario: gws is not a hold

- **WHEN** `BREW_HOLDS` is read
- **THEN** it has no `googleworkspace-cli` or `gws` entry

### Requirement: gws uses the frozen brew update path

Only a reviewed bump of the `googleworkspace-cli` row SHALL move the declared version. Raising it SHALL require the consumer check to pass on the candidate release (see "The stonks read command is recorded and verified at the pinned version"). The upgrade SHALL go through `brew-upgrade-pinned googleworkspace-cli`. `update-extra` SHALL NOT update `gws`.

#### Scenario: An upgrade with a row bump is silent

- **WHEN** `gws` is upgraded with `brew-upgrade-pinned googleworkspace-cli` and its row is bumped to the installed version
- **THEN** the next install script run keeps it pinned and prints no drift warning for it

#### Scenario: update-extra does not touch gws

- **WHEN** `update-extra` executes
- **THEN** it runs no `gws` or `googleworkspace-cli` updater

### Requirement: The stonks read command is recorded and verified at the pinned version

The install script SHALL record, beside the `googleworkspace-cli` declaration, the read command the `stonks` plugin's sheet adapter relies on. Raising the declared version SHALL require it to pass on the candidate release, against a sheet the user owns:

- `gws sheets spreadsheets values get --params '{"spreadsheetId":"<spreadsheet-id>","range":"<tab>!A1:E5","valueRenderOption":"UNFORMATTED_VALUE"}'` exits 0 and prints a JSON object carrying `range`, `majorDimension` and `values`. `values` is an array of rows, and numeric cells come back as JSON numbers rather than formatted strings.

The ranges SHALL address the tab by name, not by its `gid`. The recorded command SHALL use placeholders only. No spreadsheet ID, tab name or cell value of the user's SHALL appear in the repository.

#### Scenario: The read check passes at the pinned version

- **WHEN** the recorded command runs on an authenticated host with the pinned version installed, against a sheet the user owns
- **THEN** it exits 0 with an object carrying `range`, `majorDimension` and `values`

#### Scenario: The check sits beside the declaration

- **WHEN** a maintainer reads the `googleworkspace-cli` declaration in the install script
- **THEN** the command above, its expected shape and the rule for raising the `BREW_VERSIONS` row are written next to it

#### Scenario: The check carries no personal identifier

- **WHEN** the recorded check is read
- **THEN** it contains the placeholders `<spreadsheet-id>` and `<tab>` and no real spreadsheet ID or tab name

### Requirement: One-time Google setup guidance is printed without credentials

The install script SHALL print `gws` setup guidance in its manual-instructions output, on both the macOS and the non-macOS branch. The guidance SHALL name these steps, done once ever by the user with their personal Google account:

- Create their own Google Cloud project and enable the Google Sheets API in it.
- Configure the OAuth consent screen with user type External and publishing status **"In production"**. In "Testing", Google issues refresh tokens that expire after 7 days. For personal use (fewer than 100 users) the app needs no verification, and the "Google hasn't verified this app" screen is shown once at consent.
- Create an OAuth client of type **Desktop app**, and save its JSON where `gws` reads its client configuration (`~/.config/gws/client_secret.json` at the declared version).

The three steps above SHALL be described as done once ever, not once per machine. Their output, the client JSON, is the file encrypted into the repository (see "The gws OAuth client file is age-encrypted and deployed by chezmoi"). On a new machine the guidance SHALL name only one remaining step, the login below, and SHALL say that `chezmoi apply` deploys the client file.

The login step is:

- Log in with exactly one scope: `gws auth login --scopes https://www.googleapis.com/auth/spreadsheets.readonly`.

The guidance also says:

- `gws` keeps its credentials encrypted, with the key in the macOS Keychain.
- Repeated logins are to be avoided. Each new login issues another refresh token, and once a client holds 100 for one account Google silently invalidates the oldest. A refresh token also dies after six months without use, or when access is revoked.

The guidance SHALL NOT recommend:

- a plain `gws auth login`, which requests Drive, Gmail, Calendar, Docs and other scopes by default;
- any scope other than `spreadsheets.readonly`;
- `gws auth setup`, which needs `gcloud`, and these dotfiles do not install `gcloud`;
- `gws auth export --unmasked`, which writes plaintext credentials;
- the "Testing" publishing status;
- a service-account key.

The repository SHALL NOT contain a Google refresh token or access token in any form, and SHALL NOT manage the credential files `gws` writes itself under `~/.config/gws/`. The only Google file it manages is the OAuth client file, and only as age ciphertext.

#### Scenario: Guidance printed on macOS

- **WHEN** the macOS branch of the install script prints its manual-installation section
- **THEN** the `gws` guidance names the Google Cloud project, the Sheets API, the "In production" publishing status with the 7-day Testing expiry, the Desktop app client and the `spreadsheets.readonly` login command

#### Scenario: Guidance printed on non-macOS

- **WHEN** the non-macOS branch of the install script prints its manual instructions
- **THEN** the same `gws` guidance is printed

#### Scenario: Only the read-only scope is named

- **WHEN** the printed guidance, the README and the manual are read
- **THEN** the only Google scope they name for `gws auth login` is `https://www.googleapis.com/auth/spreadsheets.readonly`
- **AND** they name `gws auth login` only together with `--scopes`
- **AND** they mention `gws auth export --unmasked` only to say it must not be used

#### Scenario: No Google credential enters the repository

- **WHEN** the README, the manual, the install output and the chezmoi source tree are inspected
- **THEN** the README, the manual and the install output contain no OAuth client ID, client secret or token
- **AND** the source tree contains no token, and no Google file in clear text
- **AND** the only chezmoi-managed path under `~/.config/gws/` is `client_secret.json`

#### Scenario: A new machine needs only the login

- **WHEN** the guidance is read for a machine where `chezmoi apply` has deployed the client file
- **THEN** the only step it asks for is `gws auth login --scopes https://www.googleapis.com/auth/spreadsheets.readonly`
- **AND** it describes the project, consent screen and client creation as a one-time-ever step

### Requirement: The gws OAuth client file is age-encrypted and deployed by chezmoi

The source tree SHALL contain `dot_config/gws/encrypted_private_client_secret.json.age`. On `chezmoi apply`, chezmoi SHALL decrypt it with the age identity at `~/.config/chezmoi/key.txt` and write the plaintext to `~/.config/gws/client_secret.json` with mode 600, creating `~/.config/gws/` when it does not exist, on every machine whatever its machine type. The plaintext is the Desktop app OAuth client JSON the user downloads from their own Google Cloud project, and this repository SHALL NOT restate, template or default any of its fields.

The file SHALL be committed only as age ciphertext, because the repository is public and the client JSON names the user's own GCP project and carries a client secret. No plaintext copy, plaintext template, `create_` or `modify_` variant or placeholder SHALL exist for that path. The chezmoi source SHALL hold no file that targets the refresh token or the encrypted credentials `gws` writes after login. The refresh token SHALL stay in the macOS Keychain and in `gws`'s own encrypted store, and SHALL NOT be written to the repository in any form.

Chezmoi SHALL treat the content as opaque: it decrypts and writes it without parsing it. The dotfiles SHALL add no apply-time validation of it.

The path `~/.config/gws/client_secret.json` SHALL be confirmed against the pinned `gws` before the encrypted file is created, and the spec SHALL be read as naming where `gws` reads its client configuration at the declared version.

#### Scenario: Client file deployed on chezmoi apply

- **WHEN** `chezmoi apply` runs on a host with a valid `~/.config/chezmoi/key.txt`
- **THEN** chezmoi decrypts `dot_config/gws/encrypted_private_client_secret.json.age` and writes the plaintext to `~/.config/gws/client_secret.json` with mode 600

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

### Requirement: The install script lists gws on both branches

The install script's final `info "Installation complete!"` block's `CLI tools:` line SHALL include `gws` after `linear`, on both the macOS branch and the non-macOS branch. The non-macOS manual `CLI tools:` list SHALL also include `gws` after `linear`, followed by an install hint naming `brew install googleworkspace-cli` and the version declared in its `BREW_VERSIONS` row.

#### Scenario: macOS summary mentions gws

- **WHEN** the macOS branch of the install script completes successfully
- **THEN** the closing `CLI tools:` line includes the token `gws`

#### Scenario: Non-macOS lists mention gws

- **WHEN** the non-macOS branch of the install script prints its manual instructions and completes
- **THEN** both its `CLI tools:` lines include `gws`, and the manual list is followed by the `gws` install hint
