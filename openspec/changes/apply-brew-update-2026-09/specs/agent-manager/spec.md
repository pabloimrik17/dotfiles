## MODIFIED Requirements

### Requirement: AoE notifies on session error

The AoE config `[status_hooks]` table SHALL include an `on_error` command that invokes
`terminal-notifier` with a distinct sound, so an errored/crashed session is notified differently from
`on_waiting` and `on_idle`.

Distinctness SHALL be verifiable, not merely asserted. The previous scenario checked only that an
`on_error` key exists and mentions `terminal-notifier`, which passes unchanged if both hooks collapse
to the same sound or to the default tone — the requirement could be violated without any scenario
noticing.

#### Scenario: on_error hook present

- **WHEN** the AoE config is rendered by chezmoi
- **THEN** `[status_hooks]` contains an `on_error` key whose value invokes `terminal-notifier`

#### Scenario: Error and waiting sounds are different

- **WHEN** the AoE config is rendered by chezmoi
- **THEN** the sound named by `on_error` differs from the sound named by `on_waiting`, and neither
  omits its sound argument

## ADDED Requirements

### Requirement: AoE notifications replace rather than accumulate

Every `terminal-notifier` invocation in the AoE `[status_hooks]` table SHALL pass a group identifier,
so a new notification for a session replaces that session's previous one instead of stacking beside
it. Without a group identifier each state transition leaves a separate notification behind, and AoE
supervises a fleet of sessions, so the pile grows with every transition.

The group identifier SHALL distinguish sessions from one another, so a transition in one session does
not replace the notification for a different session.

This is adoptable on the currently installed `terminal-notifier` 2.0.0, which already documents the
option, and it is a prerequisite for 3.x, where the absence of a group identifier is what makes
notifications accumulate.

#### Scenario: Every notifying hook passes a group

- **WHEN** the AoE config is rendered by chezmoi
- **THEN** each `[status_hooks]` command that invokes `terminal-notifier` passes a group identifier

#### Scenario: A session's notifications replace each other

- **WHEN** one AoE session transitions state twice
- **THEN** the second notification replaces the first rather than appearing alongside it

#### Scenario: Different sessions do not collide

- **WHEN** two AoE sessions transition state
- **THEN** each session's notification is independent, so neither replaces the other
