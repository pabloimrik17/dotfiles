# Capability: managed-step-failure-visibility

## Purpose

Requires that a chezmoi-managed step either fail loudly or expose an observable verification, so a
step can never report success while its effect is absent. Codifies a defect class this repo has hit
in six unrelated places.

## Requirements

### Requirement: A managed step SHALL NOT report success when its effect did not occur

Every step this repo manages SHALL either fail with a non-zero exit and a message naming what
failed, or expose a check that an operator or agent can run to observe whether the effect landed —
whether the step is a rendered config value, a merge script, an install group or a hook. Silent
success is the prohibited outcome.

This requirement exists because the same failure shape recurred independently: a status line assigned
with an eager-expansion flag baked an empty string and went unnoticed for five months; the three
`modify_` merge scripts passed the live file through unchanged when their merge engine errored, and
`chezmoi apply` still exited 0; the `bd prime` session hook drops memories from injected context
without an error when the binary's schema is skewed; the cask install group reports every entry
installed while the package manager owns two of them; and a worktrunk `template-append` fragment
would be discarded because neither template references the placeholder it renders into.

#### Scenario: A managed merge that cannot complete fails loudly

- **WHEN** a managed merge step's engine exits non-zero
- **THEN** the step exits non-zero and names the file it failed to merge, rather than leaving the
  live file in place and reporting success

#### Scenario: An install group's report matches what it actually owns

- **WHEN** an install group reports how many of its entries are installed
- **THEN** the count reflects entries the package manager actually manages, not entries satisfied by
  a weaker check

#### Scenario: A verification exists for each effect this change fixes

- **WHEN** this change repairs a step that was previously failing silently
- **THEN** the repair ships with a check that would have observed the original failure

### Requirement: A requirement's scenarios SHALL be able to detect its own violation

Where a requirement states an observable behavior, at least one of its scenarios SHALL assert that
behavior rather than only asserting that configuration text was rendered. A requirement whose
scenarios verify only rendering passes unchanged while the behavior it describes is broken, which is
the same silent-success defect expressed at the specification level.

#### Scenario: Behavioral requirement has a behavioral scenario

- **WHEN** a requirement states that a managed value produces a particular runtime effect
- **THEN** at least one scenario asserts the runtime effect, not merely the presence of the value in
  a rendered file

#### Scenario: Rendering-only scenarios are a deliberate choice

- **WHEN** a requirement's scenarios verify rendering alone
- **THEN** the requirement text describes only rendering, so requirement and scenarios agree
