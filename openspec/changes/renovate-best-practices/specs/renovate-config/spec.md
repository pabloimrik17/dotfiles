## ADDED Requirements

### Requirement: Renovate extends the best-practices baseline

`renovate.json` SHALL extend `config:best-practices` as its base preset and SHALL NOT extend `config:recommended` directly. Presets transitively enabled by `config:best-practices` (such as `:dependencyDashboard`) SHALL NOT be listed explicitly in `extends`. Presets that `config:best-practices` does NOT enable and that the repo still requires — `:semanticCommits` and `:enableVulnerabilityAlertsWithLabel(security)` — SHALL remain in `extends`.

#### Scenario: Base preset is best-practices

- **WHEN** `renovate.json` `extends` is inspected
- **THEN** it contains `config:best-practices`
- **AND** it does NOT contain `config:recommended`

#### Scenario: Subsumed presets are not duplicated

- **WHEN** `renovate.json` `extends` is inspected
- **THEN** presets already enabled by `config:best-practices` are not listed again

#### Scenario: Required non-bundled presets are preserved

- **WHEN** `renovate.json` `extends` is inspected
- **THEN** `:semanticCommits` and `:enableVulnerabilityAlertsWithLabel(security)` are present

### Requirement: Renovate enables hardening presets

`renovate.json` `extends` SHALL include the hardening presets `:enablePreCommit`, `security:openssf-scorecard`, `docker:enableMajor`, `customManagers:githubActionsVersions`, and `customManagers:dockerfileVersions`. These presets are no-ops when their target files are absent and SHALL NOT cause validation errors.

#### Scenario: Hardening presets are listed

- **WHEN** `renovate.json` `extends` is inspected
- **THEN** it includes `:enablePreCommit`, `security:openssf-scorecard`, `docker:enableMajor`, `customManagers:githubActionsVersions`, and `customManagers:dockerfileVersions`

#### Scenario: Hardening presets validate cleanly

- **WHEN** `renovate-config-validator` runs against `renovate.json`
- **THEN** it reports no errors caused by the hardening presets

### Requirement: Vulnerability PRs bypass global throttling

`renovate.json` SHALL define a `vulnerabilityAlerts` object that sets `prHourlyLimit` to `0` and `prConcurrentLimit` to `0`, so security PRs are not rate-limited by the repo-wide `prHourlyLimit` / `prConcurrentLimit` caps.

#### Scenario: vulnerabilityAlerts overrides limits

- **WHEN** `renovate.json` is inspected
- **THEN** `vulnerabilityAlerts.prHourlyLimit` equals `0`
- **AND** `vulnerabilityAlerts.prConcurrentLimit` equals `0`

#### Scenario: Routine limits are unchanged

- **WHEN** `renovate.json` top-level config is inspected
- **THEN** the global `prHourlyLimit` and `prConcurrentLimit` retain their existing routine-update values

### Requirement: CustomManager bumps the pinned validator

`renovate.json` SHALL include a regex `customManager` that matches the `bunx --package <pkg>@<ver> <cmd>` (and `-p` short form) invocation shape, so Renovate can bump the pinned `renovate` version used by the config validator. This manager SHALL be additive and SHALL NOT remove or break the existing MCP/CLI/install-script customManagers.

#### Scenario: Pinned validator version is tracked

- **WHEN** Renovate scans the workflow and lint-staged config
- **THEN** the `bunx --package renovate@<ver>` invocation is recognized as a `npm` dependency
- **AND** a newer `renovate` release produces an update PR

#### Scenario: Existing customManagers remain intact

- **WHEN** `renovate.json` `customManagers` is inspected
- **THEN** the existing managers for `opencode.json`, `.mcp.json`, CI `pnpm dlx|bunx|npx`, and the install script are still present

### Requirement: CI validates the Renovate config

The CI workflow `.github/workflows/ci.yml` SHALL run `renovate-config-validator` in `--strict` mode against the repo's Renovate config, invoked via `bunx` against a pinned `renovate@<ver>`. A config validation failure SHALL fail the CI job.

#### Scenario: Valid config passes CI

- **WHEN** CI runs on a PR with a valid `renovate.json`
- **THEN** the validation step exits successfully

#### Scenario: Invalid config fails CI

- **WHEN** CI runs on a PR with a malformed `renovate.json`
- **THEN** the `renovate-config-validator --strict` step exits non-zero
- **AND** the CI job fails

#### Scenario: Validator version is pinned

- **WHEN** the CI validation step is inspected
- **THEN** it invokes a fixed `renovate@<ver>` rather than a floating/unpinned version
