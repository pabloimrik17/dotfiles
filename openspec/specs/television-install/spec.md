# Capability: television-install

## Purpose

Television brew installation and cable channel download during the install script.

## Requirements

### Requirement: Television is installed via brew

The `BREW_PACKAGES` array SHALL include `television` so that the `tv` binary is installed during the brew packages group.

#### Scenario: television included in brew packages

- **WHEN** the install script runs the brew packages group
- **THEN** `television` is listed in `BREW_PACKAGES` and installed via `brew install television`

#### Scenario: television already installed

- **WHEN** `tv` binary is already in PATH
- **THEN** the install script skips television installation with an informational message

### Requirement: Cable channels are downloaded after television install

After the brew packages group completes and television is confirmed installed, the install script SHALL run `tv update-channels` to download the latest community cable channels. This step SHALL be non-blocking -- failure to download channels does not stop the script.

#### Scenario: Fresh install downloads cable channels

- **WHEN** television is newly installed and no cable channels exist in `~/.config/television/cable/`
- **THEN** `tv update-channels` runs and populates the cable directory with community channels

#### Scenario: Cable channel download failure is non-fatal

- **WHEN** `tv update-channels` fails (e.g., no network)
- **THEN** the install script logs a warning and continues without error

#### Scenario: tv update-channels only runs if tv is available

- **WHEN** the brew packages group is skipped by the user
- **THEN** `tv update-channels` does NOT run (guarded by `command -v tv` check)
