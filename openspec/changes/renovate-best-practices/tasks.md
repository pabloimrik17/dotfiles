## 1. Pin the Renovate version

- [x] 1.1 Determine the current `renovate` npm release at implementation time and use it as `<ver>` everywhere below (CI, lint-staged, customManager match). Resolved to `renovate@43.227.0`.

## 2. Update `renovate.json` extends

- [x] 2.1 Replace `config:recommended` with `config:best-practices` in `extends`.
- [x] 2.2 Remove presets now subsumed by `config:best-practices`: drop `:dependencyDashboard` from `extends` and remove the redundant top-level `"configMigration": true`.
- [x] 2.3 Confirm `:semanticCommits` and `:enableVulnerabilityAlertsWithLabel(security)` remain in `extends` (not bundled by best-practices).
- [x] 2.4 Add the hardening presets to `extends`: `security:openssf-scorecard`, `docker:enableMajor`, `customManagers:githubActionsVersions`, `customManagers:dockerfileVersions`. Omit `:enablePreCommit` (inert — no `.pre-commit-config.yaml`; aligned with monolab).
- [x] 2.5 List `:maintainLockFilesWeekly` explicitly in `extends` for cross-repo parity with monolab (best-practices already bundles it in renovate@43; redundant but idempotent).

## 3. npm release-age floor

- [x] 3.1 Raise the top-level `minimumReleaseAge` from `"7 days"` to `"14 days"`.
- [x] 3.2 Append a trailing npm `packageRule` (`matchDatasources: ["npm"]`, `minimumReleaseAge: "14 days"`) to counter the 3-day window from `security:minimumReleaseAgeNpm` (bundled by best-practices).

## 4. Vulnerability throttling override

- [x] 4.1 Add a top-level `vulnerabilityAlerts` object with `"prHourlyLimit": 0` and `"prConcurrentLimit": 0`.
- [x] 4.2 Leave the routine global `prConcurrentLimit: 10` / `prHourlyLimit: 2` unchanged.

## 5. CustomManager for the pinned validator

- [x] 5.1 Add a regex `customManager` matching the `bunx (?:--package|-p) <pkg>@<ver>` invocation shape, with `datasourceTemplate: "npm"`, covering `^\.github/workflows/.+\.ya?ml$` and `^lint-staged\.config\.ts$`.
- [x] 5.2 Migrate the four existing customManagers' `fileMatch` keys to `managerFilePatterns` (forced by `renovate-config-validator --strict`; `:configMigration` from best-practices would auto-PR the same). Matching logic (`matchStrings`/`datasourceTemplate`) left byte-identical.

## 6. Local validation (husky + lint-staged)

- [x] 6.1 Add a `"renovate.json"` entry to `lint-staged.config.ts` running `bunx --package renovate@43.227.0 renovate-config-validator --strict`.
- [x] 6.2 Keep the existing `"*": "oxfmt ..."` entry; do not modify `.husky/pre-commit`.

## 7. CI validation (standalone path-filtered workflow)

- [x] 7.1 Add `.github/workflows/renovate-config-validator.yml` triggered on `pull_request` with a `paths` filter over the Renovate config files (`renovate.json`, `renovate.json5`, `.renovaterc*`, `.github/renovate.json*`).
- [x] 7.2 Job runs `bunx --package renovate@43.227.0 renovate-config-validator --strict renovate.json`; actions tag-pinned (`actions/checkout@v4`, `oven-sh/setup-bun@v2`) to match `ci.yml`.
- [x] 7.3 Remove the earlier `Validate Renovate config` step from `.github/workflows/ci.yml`.

## 8. Verify

- [x] 8.1 Run `bunx --package renovate@43.227.0 renovate-config-validator --strict renovate.json` locally against the aligned config — passes (exit 0, "Config validated successfully").
- [x] 8.2 Confirmed earlier on commit: the lint-staged `renovate.json` task fired `renovate-config-validator --strict` on the single staged `renovate.json` ("renovate.json — 1 file") and passed; the glob key matches that file only.
- [x] 8.3 Confirm `renovate-config-validator --strict` rejects a broken config (wrong-type + unknown-key → exit 1, "Found errors in configuration"). Tested on a temp copy; working file untouched.
- [ ] 8.4 After merge, watch the next scheduled Renovate run / Dependency Dashboard for config-migration or validation errors. (Post-merge manual step.)
