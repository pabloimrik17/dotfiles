## 1. Pin the Renovate version

- [x] 1.1 Determine the current `renovate` npm release at implementation time and use it as `<ver>` everywhere below (CI, lint-staged, customManager match). Resolved to `renovate@43.227.0`.

## 2. Update `renovate.json` extends

- [x] 2.1 Replace `config:recommended` with `config:best-practices` in `extends`.
- [x] 2.2 Remove presets now subsumed by `config:best-practices`: drop `:dependencyDashboard` from `extends` and remove the redundant top-level `"configMigration": true`.
- [x] 2.3 Confirm `:semanticCommits` and `:enableVulnerabilityAlertsWithLabel(security)` remain in `extends` (not bundled by best-practices).
- [x] 2.4 Add the hardening presets to `extends`: `:enablePreCommit`, `security:openssf-scorecard`, `docker:enableMajor`, `customManagers:githubActionsVersions`, `customManagers:dockerfileVersions`.

## 3. Vulnerability throttling override

- [x] 3.1 Add a top-level `vulnerabilityAlerts` object with `"prHourlyLimit": 0` and `"prConcurrentLimit": 0`.
- [x] 3.2 Leave the routine global `prConcurrentLimit: 10` / `prHourlyLimit: 2` unchanged.

## 4. CustomManager for the pinned validator

- [x] 4.1 Add a regex `customManager` matching the `bunx (?:--package|-p) <pkg>@<ver>` invocation shape, with `datasourceTemplate: "npm"`, covering `^\.github/workflows/.+\.ya?ml$` and `^lint-staged\.config\.ts$`.
- [x] 4.2 Migrate the four existing customManagers' `fileMatch` keys to `managerFilePatterns` (forced by `renovate-config-validator --strict`; `:configMigration` from best-practices would auto-PR the same). Matching logic (`matchStrings`/`datasourceTemplate`) left byte-identical.

## 5. Local validation (husky + lint-staged)

- [x] 5.1 Add a `"renovate.json"` entry to `lint-staged.config.ts` running `bunx --package renovate@43.227.0 renovate-config-validator --strict`.
- [x] 5.2 Keep the existing `"*": "oxfmt ..."` entry; do not modify `.husky/pre-commit`.

## 6. CI validation step

- [x] 6.1 Add a `Validate Renovate config` step to `.github/workflows/ci.yml` running `bunx --package renovate@43.227.0 renovate-config-validator --strict`.
- [x] 6.2 Place it after the existing steps in the `main` job (Bun is already set up by `oven-sh/setup-bun@v2`).

## 7. Verify

- [x] 7.1 Run `bunx --package renovate@43.227.0 renovate-config-validator --strict` locally against the new config — passes (exit 0, "Config validated successfully").
- [x] 7.2 Confirmed on commit: the lint-staged `renovate.json` task fired `renovate-config-validator --strict` on the single staged `renovate.json` (lint-staged reported "renovate.json — 1 file") and passed. The glob key `renovate.json` matches that file only, so unrelated-only changes do not trigger it.
- [x] 7.3 Confirm `renovate-config-validator --strict` rejects a broken config (wrong-type + unknown-key → exit 1, "Found errors in configuration"). Tested on a temp copy; working file untouched.
- [ ] 7.4 After merge, watch the next scheduled Renovate run / Dependency Dashboard for config-migration or validation errors. (Post-merge manual step.)
