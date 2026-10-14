# Spec Delta

## ADDED Requirements

### Requirement: Plannotator updates use the non-interactive installer

The existing Plannotator step in `update-extra` SHALL invoke the official installer with `--non-interactive`, adding `--skip-skills` when git is unavailable. Plannotator SHALL remain in the manual update class with one update step. The helper SHALL propagate download and installer failures to the existing aggregate result.

#### Scenario: Normal update

- **WHEN** the Plannotator update step executes with git available
- **THEN** the downloaded official installer SHALL run with `--non-interactive`
- **AND** no second Plannotator update step SHALL run

#### Scenario: Git is unavailable

- **WHEN** the Plannotator update step executes without git
- **THEN** the installer SHALL also receive `--skip-skills`

#### Scenario: Installer fails

- **WHEN** downloading or running the Plannotator installer fails
- **THEN** the step SHALL report failure and the remaining update steps SHALL continue
- **AND** the aggregate command SHALL return nonzero as required by the existing failure-resilience contract
