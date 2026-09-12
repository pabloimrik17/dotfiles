## Purpose

Declares which Homebrew packages are deliberately held at their installed version, each with a
written reason and exit condition, so a hold is reproducible across hosts instead of being invisible
machine-local state. Also records the platform constraint that governs upgrade cost per architecture.

## ADDED Requirements

### Requirement: Version holds are declared in the repo, not left as local brew state

A `brew pin` writes only to `$(brew --prefix)/var/homebrew/pinned/`, which neither git nor chezmoi
observes. Any package this repo deliberately holds back SHALL therefore be declared in the install
script, and the script SHALL apply every declared hold on each run so a second host reaches the same
state. Applying a hold SHALL be idempotent: re-running on a host where the package is already held
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

Homebrew stopped producing `x86_64` macOS bottles in September 2026; the notice prints on every
`brew upgrade --dry-run` on such a host and directs users to MacPorts. The repo SHALL record this as
a dated constraint rather than leaving it implicit in per-package deferral notes.

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
