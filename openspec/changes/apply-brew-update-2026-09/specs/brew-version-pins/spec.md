## Purpose

Declares which Homebrew packages are deliberately held at their installed version, each with a
written reason and exit condition, so a hold is reproducible across hosts instead of being invisible
machine-local state. Also records the platform constraint that governs upgrade cost per architecture.

## ADDED Requirements

### Requirement: Version holds are declared in the repo, not left as local brew state

Any package this repo deliberately holds back SHALL be declared in the install script, and the
script SHALL apply every declared hold on each run so a second host reaches the same state. A
`brew pin` writes only to `$(brew --prefix)/var/homebrew/pinned/`, which neither git nor chezmoi
observes, so a hold made by hand protects only the host it was typed on. Applying a hold SHALL be
idempotent: re-running on a host where the package is already held
SHALL succeed without error.

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

### Requirement: Lifting a declaration actually lifts the hold

The script SHALL reconcile holds, not merely apply them: a hold it previously applied that is no
longer declared SHALL be released on the next run. A script that only ever adds holds makes removing
a declaration do nothing observable — the host stays frozen at a version nobody asked to freeze, with
no message — which is the same silent-success shape this capability exists to remove.

Reconciliation requires the script to know which holds are its own, so it SHALL record only the holds
it applied and consult that record on the next run, rather than releasing every pin present on the
host. A declared package enters the record when that run's `brew pin` succeeds, or when it was
already in the previous record and is still pinned; a hold whose release fails stays recorded. A
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

### Requirement: beads is held at the last release whose schema matches the local databases

`beads` SHALL be held. Version `1.2.2` is `v1.1.2` republished under a higher version number: its
binary understands schema version 53, while the Dolt databases on this machine are migrated to
schema version 65. Every `bd` command fails against a held-back binary, and the `bd prime` session
hook fails invisibly — memories simply stop appearing in injected context, so sessions continuing to
start normally is not evidence that an upgrade was clean.

This hold SHALL apply to every host regardless of architecture. It is a correctness hold, not a build
cost hold: on `arm64` hosts `beads` is a bottled pour, so an unwanted upgrade lands there more
easily than on a host that would have to compile it.

The exit condition SHALL be a `beads` release whose schema cursor reaches version 65 or higher.

#### Scenario: beads is held on any architecture

- **WHEN** the install script runs on either an `amd64` or an `arm64` macOS host
- **THEN** `beads` is held, and the hold is not conditional on architecture

#### Scenario: A bulk upgrade cannot advance beads

- **WHEN** a bulk `brew upgrade` runs on a host where the declared holds have been applied
- **THEN** `beads` is not upgraded

#### Scenario: Exit condition is stated, not implied

- **WHEN** the `beads` hold declaration is read
- **THEN** it names the schema version the next release must reach for the hold to be lifted

### Requirement: The Intel bottle end-of-life is recorded as a dated platform constraint

The repo SHALL record the Intel `x86_64` bottle end-of-life as a dated constraint rather than
leaving it implicit in per-package deferral notes. Homebrew stopped producing `x86_64` macOS bottles
in September 2026; the notice prints on every `brew upgrade --dry-run` on such a host and directs
users to MacPorts.

The recorded constraint SHALL state that on `amd64` macOS hosts every future formula upgrade is a
source build, that the bottles still available are a residual stock built before the cutoff rather
than an ongoing guarantee, and that upgrade-cost reasoning written for an `amd64` host does not
transfer to `arm64`.

#### Scenario: Constraint is discoverable with its date

- **WHEN** a reader looks for why formula upgrades are treated as expensive on this architecture
- **THEN** the constraint is stated with its effective date and its architecture scope

#### Scenario: Deferral reasons are scoped, not stated as universal

- **WHEN** a package upgrade is deferred because it would require a source build
- **THEN** the reason identifies the architecture it applies to, rather than presenting the cost as a
  property of the package
