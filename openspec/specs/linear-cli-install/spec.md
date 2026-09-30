# Capability: linear-cli-install

## Purpose

Installs schpet/linear-cli (`linear`) through Homebrew, frozen at the version the autonomous loop's `label-triage` step was verified against, so that step can read and label Linear issues on every macOS host. Also prints how to authenticate it without putting an API key in the repository.

## Requirements

### Requirement: linear is a frozen Homebrew formula from schpet/tap

The macOS branch of the install script SHALL install `linear` as the qualified formula
`schpet/tap/linear` in `BREW_PACKAGES`, and SHALL trust and register `schpet/tap` through
`BREW_TAPS`. `pkg_bin` SHALL map the formula to the `linear` binary, so the pre-scan finds an
installed copy.

`BREW_VERSIONS` SHALL declare `schpet/tap/linear|2.6.0`, the version the `label-triage` step was
verified against. The freeze SHALL pin the formula and report drift from that row as it does for
every frozen package (see `brew-version-pins`). `linear` SHALL NOT be a declared hold: a hold does
not install a missing package, and a fresh host needs `linear`.

#### Scenario: Fresh macOS host installs and pins linear

- **WHEN** the install script runs on a macOS host without `linear` and the user accepts the brew
  packages group
- **THEN** the script trusts and taps `schpet/tap`, installs `schpet/tap/linear` and pins it in the
  same run

#### Scenario: An installed linear is not reinstalled

- **WHEN** the pre-scan runs on a host where `linear` is on PATH
- **THEN** it counts `schpet/tap/linear` as installed and installs nothing for it

#### Scenario: The verified version is declared

- **WHEN** `BREW_VERSIONS` is read
- **THEN** it holds exactly one `linear` row, `schpet/tap/linear|2.6.0`

#### Scenario: A newer tap release is reported, not installed over

- **WHEN** the pinned `linear` differs from its declared version
- **THEN** the script warns with both versions and makes no install, upgrade or uninstall call for
  it

#### Scenario: linear is not a hold

- **WHEN** `BREW_HOLDS` is read
- **THEN** it has no `linear` or `schpet/tap` entry

### Requirement: linear uses the frozen brew update path

Only a reviewed bump of the `schpet/tap/linear` row SHALL move the declared version. Raising it
SHALL require the triage checks to pass on the candidate release (see "The triage command surface
is recorded and verified at the pinned version"). The upgrade SHALL go through
`brew-upgrade-pinned schpet/tap/linear`. `update-extra` SHALL NOT update `linear`.

#### Scenario: An upgrade with a row bump is silent

- **WHEN** `linear` is upgraded with `brew-upgrade-pinned schpet/tap/linear` and its row is bumped
  to the installed version
- **THEN** the next install script run keeps it pinned and prints no drift warning for it

#### Scenario: update-extra does not touch linear

- **WHEN** `update-extra` executes
- **THEN** it runs no `linear` updater

### Requirement: CLI authentication guidance is printed without credentials

The install script SHALL print linear-cli authentication guidance directly after the Linear MCP
guidance, on both the macOS and the non-macOS branch. The guidance SHALL name:

- `linear auth login`, which prompts for a personal API key created at
  `https://linear.app/settings/account/security` and stores it in the system keyring: the macOS
  Keychain, or `secret-tool` from libsecret on Linux. `~/.config/linear/credentials.toml` then holds
  only workspace metadata.
- `linear auth whoami` and `linear auth list` as the status checks.
- `LINEAR_API_KEY` as the fallback when no keyring is available. It takes precedence over stored
  credentials, so a stale exported key shadows the keyring.

The guidance SHALL NOT recommend `--plaintext`, which writes the key to `credentials.toml`, or
passing the key as a command-line argument. It SHALL NOT name `linear auth status`, which does not
exist in 2.6.0. The repository SHALL NOT manage `~/.config/linear/`, a project `.linear.toml`, or
any file that holds a Linear API key.

#### Scenario: Guidance printed on macOS

- **WHEN** the macOS branch of the install script prints its manual-installation section
- **THEN** the linear-cli guidance follows the Linear MCP guidance and names `linear auth login`,
  `linear auth whoami`, `linear auth list` and `LINEAR_API_KEY`

#### Scenario: Guidance printed on non-macOS

- **WHEN** the non-macOS branch of the install script prints its manual instructions
- **THEN** the same linear-cli guidance follows the Linear MCP guidance

#### Scenario: Status commands exist

- **WHEN** `linear auth whoami` runs on an authenticated host with the pinned version installed
- **THEN** it exits 0 and prints the workspace and user
- **AND** the guidance names no `linear auth` subcommand that the pinned version rejects

#### Scenario: No credential enters the repository

- **WHEN** the README, the manual, the install output and the chezmoi source tree are inspected
- **THEN** they contain no Linear API key, and no chezmoi-managed path targets `~/.config/linear/`
  or `.linear.toml`

### Requirement: The install script lists linear on both branches

The install script's final `info "Installation complete!"` block's `CLI tools:` line SHALL include
`linear` after `tuicr`, on both the macOS branch and the non-macOS branch. The non-macOS manual
`CLI tools:` list SHALL also include `linear` after `tuicr`, with an install hint for
`brew install schpet/tap/linear` or a release tarball at the declared version.

#### Scenario: macOS summary mentions linear

- **WHEN** the macOS branch of the install script completes successfully
- **THEN** the closing `CLI tools:` line includes the token `linear`

#### Scenario: Non-macOS lists mention linear

- **WHEN** the non-macOS branch of the install script prints its manual instructions and completes
- **THEN** both its `CLI tools:` lines include `linear`, and the manual list is followed by the
  `linear` install hint

### Requirement: The triage command surface is recorded and verified at the pinned version

The install script SHALL record, beside the `schpet/tap/linear` declaration, the commands the
`label-triage` step relies on. Raising the declared version SHALL require every check to pass on
the candidate release:

- `linear issue query --all-teams --json` returns an object with `nodes` and `pageInfo`, and each
  node carries `labels.nodes[].name`.
- `linear label list --json` returns an object with `nodes` and `pageInfo`.
- `linear issue update <id> --add-label <name>` adds a label and keeps the existing ones. (`--label`
  replaces the whole set, so the check targets `--add-label`.)
- `linear label create -n <name> -c '#rrggbb'` creates a label with that color.

Write checks SHALL run against a disposable issue and a disposable label, which are deleted
afterwards (`linear issue delete`, `linear label delete`).

#### Scenario: Read checks pass at the pinned version

- **WHEN** `linear issue query --all-teams --json` and `linear label list --json` run on an
  authenticated host with the pinned version installed
- **THEN** both exit 0 with objects carrying `nodes` and `pageInfo`, and every issue node carries
  `labels.nodes`

#### Scenario: Write flags are present at the pinned version

- **WHEN** `linear issue update --help` and `linear label create --help` are read at the pinned
  version
- **THEN** `issue update` offers `--add-label`, documented as keeping existing labels, and
  `label create` offers `-n, --name` and `-c, --color`

#### Scenario: Checklist sits beside the declaration

- **WHEN** a maintainer reads the `schpet/tap/linear` declaration in the install script
- **THEN** the commands above, the disposable-issue rule and the rule for raising its
  `BREW_VERSIONS` row are written next to it
