## MODIFIED Requirements

### Requirement: Host-conditional keys are removed as well as added

Where the managed set is conditional on host facts (operating system, architecture, or the chezmoi `machineType`), the merge SHALL remove a conditional key on hosts where its condition is false, not merely omit it from the overlay.

Without this, a key added on one host would persist forever in the live file of a host whose condition no longer holds.

#### Scenario: Conditional plugin entry on a non-matching host

- **WHEN** the live file contains a plugin entry that is managed only for `darwin`/`arm64`
- **AND** `chezmoi apply` runs on a host that is not `darwin`/`arm64`
- **THEN** that entry SHALL be absent from the resulting file

#### Scenario: Machine-type-conditional key on another machine type

- **WHEN** the live file contains a key that is managed only for `machineType = "personal"`
- **AND** `chezmoi apply` runs on a machine whose `machineType` is not `personal`
- **THEN** that key SHALL be absent from the resulting file
