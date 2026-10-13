# Spec Delta

## MODIFIED Requirements

### Requirement: Every brew package the repo installs is frozen at a declared version

The install script SHALL pin every formula, font cask and CLI cask it installs through brew (the freeze).
The repo SHALL declare one version for each frozen package, taken from a single reference host. The
version rows SHALL be ordered alphabetically by package name. The
freeze covers the formulae of the brew packages group and the zsh plugin group, the CLI casks of the
brew packages group, and the font casks.
It does not cover GUI app casks: on the reference host all of them are installed outside brew, and a
cask with `auto_updates` updates itself despite a pin. It does not cover transitive dependencies
either, because a pinned dependency blocks every per-package upgrade that needs a newer one.

A frozen package that is absent SHALL be installed as before, then pinned in the same run. The
freeze never prevents an install. A package declared as a hold SHALL be pinned by its hold, not by
the freeze, and SHALL NOT enter the freeze record.

A frozen package with no version row, and a version row that names no frozen package, SHALL each be
reported as an error that names the package. A frozen package without a row SHALL still be pinned.

A package installed under the same name from a different source than the one declared, such as
`llmfit` from `homebrew/core` while the tap formula is declared, SHALL still be pinned. The script
SHALL warn with the declared source and the one-time switch command, and that command SHALL unpin
first, because brew refuses to uninstall a pinned formula.

#### Scenario: Installed package is pinned

- **WHEN** the install script runs on a host where a frozen package is installed and not pinned
- **THEN** the script pins it and records it, and `brew list --pinned` lists it

#### Scenario: Installed CLI cask is pinned as a cask

- **WHEN** the install script runs on a host where a CLI cask of the brew packages group is
  installed and not pinned
- **THEN** the script pins it with `brew pin --cask` and records it as a cask

#### Scenario: Absent package is installed, then pinned

- **WHEN** a frozen package is not installed and the user accepts its install group
- **THEN** the script installs it and pins it in the same run

#### Scenario: A declined group leaves nothing to pin

- **WHEN** a frozen package is not installed and the user declines its install group
- **THEN** the script pins nothing for it and reports no warning or error about it

#### Scenario: Re-running with every package pinned is a no-op

- **WHEN** the install script runs on a host where every frozen package is installed, pinned and
  recorded
- **THEN** the script calls `brew pin` for none of them and prints no warning

#### Scenario: GUI casks and dependencies are not pinned

- **WHEN** the install script runs
- **THEN** it pins no GUI app cask and no formula installed only as a dependency

#### Scenario: A held package is not recorded by the freeze

- **WHEN** a package is both frozen and declared as a hold
- **THEN** the hold pins it, and the freeze record does not list it

#### Scenario: Frozen package without a version row

- **WHEN** a frozen package has no version row
- **THEN** the script reports an error naming the package, pins the package, and continues

#### Scenario: Version row without a frozen package

- **WHEN** a version row names a package that no install group declares
- **THEN** the script reports an error naming it and pins nothing for it

#### Scenario: Installed from a different source than declared

- **WHEN** a tap-qualified frozen package is installed under the same name from another source
- **THEN** the script pins it and warns with the declared source and a switch command that starts
  with `brew unpin`
