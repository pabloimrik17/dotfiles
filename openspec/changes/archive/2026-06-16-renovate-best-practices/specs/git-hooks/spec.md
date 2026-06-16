## MODIFIED Requirements

### Requirement: lint-staged configuration

The repo SHALL have a `lint-staged.config.ts` file that wires oxfmt to all staged files and validates the Renovate config when it is staged.

#### Scenario: All files pass through oxfmt

- **WHEN** lint-staged runs
- **THEN** all staged files are processed by `oxfmt --no-error-on-unmatched-pattern`

#### Scenario: lint-staged config is TypeScript

- **WHEN** `lint-staged.config.ts` is inspected
- **THEN** it exports a configuration object using the `Configuration` type from `lint-staged` and the `satisfies` keyword

#### Scenario: Renovate config is validated when staged

- **WHEN** `renovate.json` is among the staged files and lint-staged runs
- **THEN** `renovate-config-validator` (pinned `renovate@<ver>`, via `bunx`) runs against `renovate.json`
- **AND** the commit is aborted if validation fails

#### Scenario: Renovate validation is scoped to renovate.json

- **WHEN** a commit stages files but does not touch `renovate.json`
- **THEN** the `renovate-config-validator` entry does not run
