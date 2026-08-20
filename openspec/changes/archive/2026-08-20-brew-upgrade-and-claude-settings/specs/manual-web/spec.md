## ADDED Requirements

### Requirement: Destructive commands are never described as read-only

The manual SHALL NOT describe a command as read-only, non-destructive, or inspection-only unless it cannot delete or move user data.

Where a command is destructive behind an interactive confirmation, the manual SHALL say so, and SHALL name the genuinely read-only alternative if one exists.

This is not hypothetical: the disk-usage explorer is currently listed both as "read-only" and among the non-destructive commands, while the installed binary can move selected paths to the Trash after an Enter confirmation. Its `--help` documents only an output flag, so the capability is invisible to anyone who checks the obvious place.

#### Scenario: Disk-usage explorer is described accurately

- **WHEN** a reader consults the manual entry for the disk-usage explorer
- **THEN** it SHALL state that the command can move selected items to the Trash after confirmation

#### Scenario: Non-destructive list excludes it

- **WHEN** the manual enumerates commands that only inspect or simulate
- **THEN** the disk-usage explorer SHALL NOT appear in that list

#### Scenario: Read-only alternative is documented

- **WHEN** a reader wants a purely observational system view
- **THEN** the manual SHALL document the read-only status dashboard as the alternative

### Requirement: Documented shell helpers exist

Every shell function, alias, or command the manual instructs the reader to run SHALL exist in the shipped configuration.

The manual currently prescribes four helper functions that were removed when their functionality migrated to television. A reader following the instructions gets `command not found`, and one of them is presented inside a step-by-step flow.

#### Scenario: Every documented helper resolves

- **WHEN** each shell helper named in the manual is looked up in the shipped shell configuration
- **THEN** a definition SHALL be found for it

#### Scenario: Superseded helpers point at their replacements

- **WHEN** a helper documented in the manual has been replaced by a television channel
- **THEN** the manual SHALL name the channel instead of the removed helper

### Requirement: Manual claims about tool configuration match the shipped config

Where the manual explains how a feature is enabled, that explanation SHALL match the configuration the repo actually ships and the behaviour of the installed version.

The manual currently states that pull-request badges in the git TUI require two configuration flags together. One of them is inert — it is a deprecated key whose only consumer is unreachable once the other is set — and since the TUI's current release an open pull request renders its status as plain Unicode needing no icon font at all.

#### Scenario: Enablement instructions are accurate

- **WHEN** the manual explains how a feature is turned on
- **THEN** the named configuration keys SHALL be ones that actually affect the behaviour

#### Scenario: Deprecated keys are not taught

- **WHEN** a configuration key is deprecated and inert in the shipped setup
- **THEN** the manual SHALL NOT instruct the reader to set it
