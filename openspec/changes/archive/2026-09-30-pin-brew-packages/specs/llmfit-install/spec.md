# Spec Delta

## MODIFIED Requirements

### Requirement: A pre-existing llmfit install is never modified automatically

The install script SHALL NOT uninstall, unlink, relink or otherwise rewrite an `llmfit` already present on the host, including one installed from `homebrew/core`. Because the group's skip check is `command -v llmfit`, such a host is left exactly as it is and the tap formula is not installed there. The version freeze still pins it (see `brew-version-pins`); a pin changes no installed file.

Switching an existing core install over to the tap SHALL be left to the user as a one-time step. The freeze pass SHALL print it as a warning while the freeze record does not list the package, naming three commands in order: `brew unpin llmfit`, `brew uninstall llmfit`, then `brew install AlexsJones/llmfit/llmfit`. The unpin comes first because brew refuses to uninstall a pinned formula. The switch is worth making because the core formula builds from source where no bottle is published for the host's OS/arch. The "Manual Installation Required" section carries no llmfit entry: the reference host has migrated, and a line printed on every run is noise on hosts that have too.

#### Scenario: Host already carrying the core formula

- **WHEN** the brew packages group runs on a host where `llmfit` from `homebrew/core` is installed and linked
- **THEN** the group reports llmfit as already installed and performs no install, uninstall, unlink or relink
- **AND** no formula conflict or link collision is produced

#### Scenario: Migration is documented, not performed

- **WHEN** the freeze pass runs on a host where `llmfit` from `homebrew/core` is installed and the freeze record does not list it
- **THEN** it pins `llmfit` and prints one warning with the switch command `brew unpin llmfit && brew uninstall llmfit && brew install AlexsJones/llmfit/llmfit`
- **AND** it runs none of those three commands itself
