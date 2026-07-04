# Delta: fallow-ci

## ADDED Requirements

### Requirement: PR audit workflow via official action

The repo SHALL contain `.github/workflows/fallow.yml`, separate from `ci.yml`, triggered on `pull_request`, with permissions `contents: read`, `checks: write`, `pull-requests: write`. The job SHALL check out with `fetch-depth: 0` and run the official `fallow-rs/fallow` action (v3 line) with `command: audit`, `gate: new-only`, `comment: true`, `comment-layout: compact`. The job SHALL NOT install bun or node — the action is self-contained.

#### Scenario: PR with no introduced findings

- **WHEN** a pull request touches files without introducing new fallow findings
- **THEN** the workflow passes, even if pre-existing findings are reported in touched files

#### Scenario: PR introduces an error-severity finding

- **WHEN** a pull request introduces a finding whose rule severity is `error`
- **THEN** the audit verdict is `fail` and the workflow fails with a compact sticky PR comment explaining the findings

#### Scenario: Existing CI workflow unchanged in permissions

- **WHEN** reading `.github/workflows/ci.yml`
- **THEN** it retains its default read-only permissions (fallow's write permissions live only in `fallow.yml`)

### Requirement: CI version follows the devDependency pin

The workflow SHALL omit the action's `version` input so the action resolves the fallow version from the `package.json` devDependency — a single Renovate-managed version source for the project layer.

#### Scenario: Renovate bumps the devDependency

- **WHEN** Renovate merges a fallow devDependency bump
- **THEN** subsequent workflow runs use the new version with no workflow file change
