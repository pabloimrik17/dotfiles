# renovate-config Specification

## Purpose
TBD - created by archiving change renovate-best-practices. Update Purpose after archive.
## Requirements
### Requirement: Renovate extends the best-practices baseline

`renovate.json` SHALL extend `config:best-practices` as its base preset and SHALL NOT extend `config:recommended` directly. Presets transitively enabled by `config:best-practices` (such as `:dependencyDashboard`) SHALL NOT be listed explicitly in `extends`, with one deliberate exception: `:maintainLockFilesWeekly` MAY be listed explicitly for cross-repo parity with the monolab migration — it is bundled by `config:best-practices` in renovate@43, so re-listing it is idempotent and validator-clean. Presets that `config:best-practices` does NOT enable and that the repo still requires — `:semanticCommits` and `:enableVulnerabilityAlertsWithLabel(security)` — SHALL remain in `extends`.

#### Scenario: Base preset is best-practices

- **WHEN** `renovate.json` `extends` is inspected
- **THEN** it contains `config:best-practices`
- **AND** it does NOT contain `config:recommended`

#### Scenario: Subsumed presets are not duplicated

- **WHEN** `renovate.json` `extends` is inspected
- **THEN** presets already enabled by `config:best-practices` are not listed again, except `:maintainLockFilesWeekly` which is kept explicit for cross-repo parity

#### Scenario: Required non-bundled presets are preserved

- **WHEN** `renovate.json` `extends` is inspected
- **THEN** `:semanticCommits` and `:enableVulnerabilityAlertsWithLabel(security)` are present

### Requirement: Renovate enables hardening presets

`renovate.json` `extends` SHALL include the hardening presets `security:openssf-scorecard`, `docker:enableMajor`, `customManagers:githubActionsVersions`, `customManagers:dockerfileVersions`, and `:maintainLockFilesWeekly`. These presets are no-ops when their target files are absent and SHALL NOT cause validation errors. `renovate.json` SHALL NOT include `:enablePreCommit` while the repo has no `.pre-commit-config.yaml` (the preset is inert under the husky + lint-staged setup).

#### Scenario: Hardening presets are listed

- **WHEN** `renovate.json` `extends` is inspected
- **THEN** it includes `security:openssf-scorecard`, `docker:enableMajor`, `customManagers:githubActionsVersions`, `customManagers:dockerfileVersions`, and `:maintainLockFilesWeekly`

#### Scenario: enablePreCommit is omitted

- **WHEN** the repo contains no `.pre-commit-config.yaml`
- **THEN** `renovate.json` `extends` does NOT contain `:enablePreCommit`

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

### Requirement: npm release-age floor is preserved

`renovate.json` SHALL keep an effective `minimumReleaseAge` of at least `14 days` for npm packages. Because `config:best-practices` bundles `security:minimumReleaseAgeNpm` (a 3-day npm `packageRule`) that overrides the top-level value for npm, `renovate.json` SHALL re-assert the floor with a trailing npm `packageRule` ordered after the preset's rule.

#### Scenario: Top-level floor raised

- **WHEN** `renovate.json` is inspected
- **THEN** the top-level `minimumReleaseAge` is `"14 days"`

#### Scenario: npm window re-asserted

- **WHEN** `renovate.json` `packageRules` is inspected
- **THEN** a rule with `matchDatasources: ["npm"]` sets `minimumReleaseAge` to `"14 days"`
- **AND** it appears after any preset-provided npm release-age rule so it takes precedence

### Requirement: CI validates the Renovate config

A standalone, path-filtered GitHub Actions workflow (`.github/workflows/renovate-config-validator.yml`) SHALL run `renovate-config-validator` in `--strict` mode against the repo's Renovate config, invoked via `bunx` against a pinned `renovate@<ver>`. The workflow SHALL trigger only when a Renovate config file changes (a `pull_request` `paths` filter). A config validation failure SHALL fail the job.

#### Scenario: Valid config passes CI

- **WHEN** the workflow runs on a PR with a valid `renovate.json`
- **THEN** the validation step exits successfully

#### Scenario: Workflow is path-filtered

- **WHEN** a PR changes no Renovate config file
- **THEN** the validator workflow does not run

#### Scenario: Invalid config fails CI

- **WHEN** the workflow runs on a PR with a malformed `renovate.json`
- **THEN** the `renovate-config-validator --strict` step exits non-zero
- **AND** the job fails

#### Scenario: Validator version is pinned

- **WHEN** the workflow validation step is inspected
- **THEN** it invokes a fixed `renovate@<ver>` rather than a floating/unpinned version

