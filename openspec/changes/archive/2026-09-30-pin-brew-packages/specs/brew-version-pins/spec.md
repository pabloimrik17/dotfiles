# Spec Delta

## MODIFIED Requirements

### Requirement: Version holds are declared in the repo, not left as local brew state

A package held back because a newer version is wrong for this repo SHALL be declared as a hold.
Holds live in the install script. On each run the script SHALL hold every declared package that is
installed and SHALL NOT install one that is not, so no host installs or advances a held package. A
`brew pin` writes only to `$(brew --prefix)/var/homebrew/pinned/`, which neither git nor chezmoi
observes, so a hold made by hand protects only the host it was typed on. Applying a hold SHALL be
idempotent: re-running on a host where the package is already held
SHALL succeed without error.

A hold is not the version freeze (see "Every brew package the repo installs is frozen at a declared
version"). The freeze pins what the repo installs and installs it when it is absent. A hold stops
the package from being installed or advanced at all, so it is kept for packages where the version
brew would install is itself the danger.

A declared hold SHALL carry two things in the source: the reason the package is held, and the
condition under which the hold is lifted. A hold without a stated exit condition is indistinguishable
from an oversight.

#### Scenario: Declared hold is applied on a host that has none

- **WHEN** the install script runs on a host where a declared package is installed but not held
- **THEN** the script holds it and reports which packages it held

#### Scenario: Re-running on an already-held host is a no-op

- **WHEN** the install script runs on a host where every declared package is already held
- **THEN** each hold operation exits successfully and the script continues without warning

#### Scenario: Every declared hold states its reason and exit condition

- **WHEN** the declared hold list is read
- **THEN** each entry carries both a reason and the condition under which the hold is lifted

#### Scenario: A declared package that is missing is skipped with a warning

- **WHEN** the install script runs on a host where a declared package is not installed
- **THEN** the script does not install it or count it as pending, holds nothing for it, and prints
  one warning naming the package, its reason and its exit condition

### Requirement: Lifting a declaration actually lifts the hold

The script SHALL reconcile holds, not merely apply them: a hold it previously applied that is no
longer declared SHALL be released on the next run. A script that only ever adds holds makes removing
a declaration do nothing observable — the host stays frozen at a version nobody asked to freeze, with
no message — which is the same silent-success shape this capability exists to remove.

Reconciliation requires the script to know which holds are its own, so it SHALL record only the holds
it applied and consult that record on the next run, rather than releasing every pin present on the
host. A declared package enters the record when that run's `brew pin` succeeds, when it was already
in the previous record and is still pinned, or when the freeze record lists it and it is still
pinned (the hold adopts the freeze's pin); a hold whose release fails stays recorded. A
package that is not installed, or that was already pinned by hand, SHALL NOT be recorded, so lifting
its declaration never releases a hand-made pin. A recorded package that is no longer installed SHALL
be dropped from the record without calling `brew unpin`, so lifting a declaration never calls
`brew unpin` on a package that is absent.

#### Scenario: Removing a declaration releases the hold

- **WHEN** a package is removed from the declared hold list and the install script runs again
- **THEN** the script releases that hold and reports which packages it released, and
  `brew list --pinned` no longer lists the package

#### Scenario: Holds the script did not apply are left alone

- **WHEN** a package is pinned on the host by hand and was never declared
- **THEN** the script leaves that pin in place

#### Scenario: A declared package already pinned by hand is not claimed

- **WHEN** a package already pinned by hand is declared, the install script runs, and the declaration
  is then removed and the script runs again
- **THEN** the script does not record the package as its hold, and the pin is still in place after
  the second run

#### Scenario: A declared package that is not installed is not recorded

- **WHEN** a declared package is not installed when the install script runs, and the declaration is
  then removed and the script runs again
- **THEN** the script does not record the package, does not call `brew unpin` on it, and reports no
  error

#### Scenario: A recorded hold whose package was uninstalled is dropped

- **WHEN** a package the script recorded is uninstalled, its declaration is then removed, and the
  install script runs again
- **THEN** the script does not call `brew unpin` on it, drops it from the record, and reports no error

#### Scenario: An unchanged declaration is not churned

- **WHEN** the install script runs twice with the declared list unchanged
- **THEN** no hold is released, and `brew list --pinned` reports the same set after both runs

## ADDED Requirements

### Requirement: Every brew package the repo installs is frozen at a declared version

The install script SHALL pin every formula and font cask it installs through brew (the freeze).
The repo SHALL declare one version for each frozen package, taken from a single reference host. The
version rows SHALL be ordered alphabetically by package name. The
freeze covers the formulae of the brew packages group and the zsh plugin group, and the font casks.
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

### Requirement: A declared version reports drift and does not enforce it

The script SHALL compare each frozen package's pinned version with its declared version and warn on
each mismatch. It SHALL NOT install, upgrade, downgrade or uninstall anything because of a mismatch.
Brew installs only the current version of a formula, so an older declared version is out of reach,
and an upgrade toward a newer declared version can overshoot it. A mismatch is a warning, not an
error: an error makes the script exit non-zero, and chezmoi then re-runs it on every apply.

The comparison SHALL use the full installed version string, including any `_N` revision suffix,
because `brew upgrade` also installs a revision bump. Held packages are compared too.

#### Scenario: Matching version is silent

- **WHEN** a frozen package's pinned version equals its declared version
- **THEN** the script prints nothing about that package's version

#### Scenario: Mismatch is warned and left in place

- **WHEN** a frozen package's pinned version differs from its declared version
- **THEN** the script prints one warning naming the package, the declared version and the pinned
  version, makes no install, upgrade or uninstall call for it, and leaves the error count unchanged

#### Scenario: A revision bump counts as drift

- **WHEN** a package is declared at `1.18.2` and its pinned keg is `1.18.2_1`
- **THEN** the script warns about the mismatch

#### Scenario: A forgotten version bump surfaces on the next run

- **WHEN** a frozen package is upgraded by hand and its version row is not updated
- **THEN** the next run of the install script warns that the pinned version differs from the
  declared one

### Requirement: Removing a package from the freeze releases its pin

The script SHALL release a pin that the freeze applied once that package is no longer frozen. It
SHALL track these pins in a record kept separately from the hold record. The record rules match
the ones for holds. The record SHALL list only pins the freeze applied, or pins it recorded before
that are still in place. A pin made by hand SHALL NOT be recorded, so removing a package never
releases a hand pin. A recorded package that is no longer installed SHALL be dropped from the record
without calling `brew unpin`. A release that fails SHALL stay recorded so the next run retries it.
The record SHALL keep whether each package is a formula or a cask, so the release unpins the right
kind.

#### Scenario: A removed package is unpinned

- **WHEN** a frozen formula or cask is removed from its install group and version table, and the
  install script runs again
- **THEN** the script unpins it, reports the release, and `brew list --pinned` no longer lists it

#### Scenario: A hand pin is left alone

- **WHEN** a package was pinned by hand before it became frozen, and is later removed from the
  freeze
- **THEN** the pin is still in place after the next run

#### Scenario: An uninstalled recorded package is dropped

- **WHEN** a package in the freeze record is uninstalled, then removed from the freeze, and the
  install script runs again
- **THEN** the script does not call `brew unpin` for it, drops it from the record, and reports no
  error

#### Scenario: A freeze-owned pin becomes a hold before removal

- **WHEN** a package pinned and recorded by the freeze becomes a declared hold
- **THEN** the hold adopts the pin in its own record and the freeze drops its record without
  unpinning; if both declarations are later removed, the hold releases the pin
