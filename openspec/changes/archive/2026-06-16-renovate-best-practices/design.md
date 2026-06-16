## Context

`renovate.json` currently extends `config:recommended` plus `:dependencyDashboard`, `:semanticCommits`, and `:enableVulnerabilityAlertsWithLabel(security)`. The repo is a chezmoi-managed dotfiles repo using **bun** (CLAUDE.md mandate), with git hooks via **husky + lint-staged + commitlint** and a single CI workflow (`.github/workflows/ci.yml`). There is no Dockerfile and no `.pre-commit-config.yaml`.

GitHub issue #140 asks to move to `config:best-practices`, add hardening presets, unthrottle security PRs, and add config validation. The issue's examples assume **prek + pnpm**; this design reconciles them to the repo's actual **husky/lint-staged + bun** stack (confirmed with the user).

## Goals / Non-Goals

**Goals:**

- Adopt `config:best-practices` as the base preset; remove presets it already bundles.
- Add the hardening presets `security:openssf-scorecard`, `docker:enableMajor`, `customManagers:githubActionsVersions`, `customManagers:dockerfileVersions` (omitting `:enablePreCommit` — inert without a `.pre-commit-config.yaml`). List `:maintainLockFilesWeekly` explicitly for cross-repo parity with monolab, though best-practices already bundles it.
- Add a `vulnerabilityAlerts` block that zeroes the hourly/concurrent PR limits.
- Preserve a 14-day npm release-age floor despite `security:minimumReleaseAgeNpm` (bundled by best-practices) lowering it to 3 days.
- Validate the Renovate config at commit time (lint-staged) and PR time (a path-filtered CI workflow), against a pinned `renovate` version that Renovate itself bumps.

**Non-Goals:**

- No change to `rangeStrategy: pin`, the monthly `packageRules` schedules, or reviewers/labels. (`minimumReleaseAge` IS raised 7d → 14d — see Decision 8.)
- No change to the *matching logic* (`matchStrings`/`datasourceTemplate`) of the existing MCP/CLI/install-script customManagers. Their `fileMatch` keys ARE migrated to `managerFilePatterns` — see Decision 7.
- No introduction of prek or any second pre-commit framework.
- No addition of `renovate` to `package.json` devDependencies.

## Decisions

**1. `config:best-practices` + prune subsumed presets.**
Replace `config:recommended` with `config:best-practices`. Verified against the `renovate@43.227.0` preset definition, `config:best-practices` transitively enables `config:recommended` (which includes `:dependencyDashboard`), `docker:pinDigests`, `helpers:pinGitHubActionDigests`, `:configMigration`, `:pinDevDependencies`, `abandonments:recommended`, `security:minimumReleaseAgeNpm`, and `:maintainLockFilesWeekly`, so any of those listed explicitly become noise (in our config that means dropping `:dependencyDashboard` and the top-level `configMigration: true`, both now redundant). Keep `:semanticCommits` and `:enableVulnerabilityAlertsWithLabel(security)` — neither is bundled. `:maintainLockFilesWeekly` is the one deliberate redundancy, kept explicit for cross-repo parity with monolab (see Decision 9). The `renovate-config-validator` and Renovate's own `:configMigration` PRs are the safety net that confirms nothing required was dropped.
*Alternative rejected:* keep `config:recommended` and hand-list each best-practice preset — that is exactly the maintenance noise the preset exists to remove.

**2. Validator via `bunx --package renovate@<ver> renovate-config-validator` (verified on bun 1.3.10).**
`renovate-config-validator` is a binary inside the `renovate` package, so the eponymous `bunx renovate@<ver>` form won't reach it — `--package`/`-p` is required. The pinned version is invoked on demand; bun caches it globally. We do NOT add `renovate` to `devDependencies` (it's large and only needed for validation).
*Alternative rejected:* `devDependencies` entry — bloats install for a validation-only tool; on-demand bunx + the self-bumping customManager covers it.

**3. Local validation as a `renovate.json`-scoped lint-staged entry.**
Add `"renovate.json": "bunx --package renovate@<ver> renovate-config-validator"` to `lint-staged.config.ts`. lint-staged only runs it when `renovate.json` is staged and appends the staged path as the file argument, so it self-scopes. Runs through the existing `.husky/pre-commit` → `bunx lint-staged` chain; no `.husky/` script change.
*Note:* `:enablePreCommit` is **not** added: with no `.pre-commit-config.yaml` the preset is inert, and listing it is misleading. Aligned with the monolab migration; revisit only if prek is adopted.

**4. CI validation as a standalone, path-filtered workflow, `--strict`.**
A dedicated `.github/workflows/renovate-config-validator.yml` runs `bunx --package renovate@43.227.0 renovate-config-validator --strict renovate.json`, triggered only when a Renovate config file changes (a `pull_request` `paths` filter). Kept out of the main `ci.yml` so it stays fast and independently skippable. Its actions are tag-pinned (`@v4`/`@v2`) to match the repo's existing `ci.yml`; `helpers:pinGitHubActionDigests` (now active via best-practices) will SHA-pin all workflows uniformly in a follow-up Renovate PR. Matches the monolab migration's structure.

**5. Additive `bunx -p` customManager.**
The existing `(?:pnpm dlx|bunx|npx) <pkg>@<ver>` regex does not match the `bunx -p <pkg>@<ver> <bin>` shape (version sits after the `-p` token, before the binary name). Add a complementary regex customManager matching `bunx (?:--package|-p) <pkg>@<ver>` with `datasourceTemplate: npm`, covering `.github/workflows/*.yml` and `lint-staged.config.ts`. The existing customManagers' matching logic is untouched.

**6. Pinned version chosen at implementation time.**
Pin to the current `renovate` release when implementing — resolved to **`renovate@43.227.0`** (the issue's `40.0.0` was illustrative). The `bunx -p` customManager keeps it current thereafter.

**7. Migrate `fileMatch` → `managerFilePatterns` on all customManagers (forced by `--strict`).**
`renovate-config-validator --strict` exits non-zero on the current config with "Config migration necessary" because Renovate renamed `fileMatch` to `managerFilePatterns` (regex values wrapped as `/…/`). Since the validator must pass `--strict` (CI + lint-staged), the four existing customManagers' `fileMatch` keys are migrated to `managerFilePatterns` alongside the new one. This is precisely the migration `:configMigration` (bundled in `config:best-practices`) would auto-PR, so it is in-scope for this change rather than incidental churn. Only the key name changes; every `matchStrings`/`datasourceTemplate` is byte-identical.
*Alternative rejected:* drop `--strict` to silence the migration warning — defeats the validator's purpose and contradicts the spec.

**8. Raise `minimumReleaseAge` to 14 days + re-assert for npm.**
`config:best-practices` bundles `security:minimumReleaseAgeNpm`, which adds an npm `packageRule` with `minimumReleaseAge: "3 days"`. Because `packageRules` override the top-level value per matching package, npm dependencies would silently drop below the repo's intended floor. Raise the top-level `minimumReleaseAge` to `14 days` (covers all datasources) and append a trailing npm `packageRule` re-asserting `14 days`. Since user `packageRules` merge *after* preset rules, the trailing rule wins. Value (14d) aligns with the monolab migration.

**9. List `:maintainLockFilesWeekly` explicitly despite being bundled.**
`config:best-practices` already includes `:maintainLockFilesWeekly` in `renovate@43`, so listing it is redundant. Kept explicit for intent parity with the monolab `renovate.json`; re-listing a bundled preset is idempotent and validator-clean. (The dotfiles issue #140, which claimed it was *not* bundled, predates this.)

## Risks / Trade-offs

- **Dropping a preset that best-practices does NOT actually bundle → silent behavior loss.** → Mitigation: only `:dependencyDashboard` and `configMigration` are pruned (both documented as part of recommended/best-practices); validator + Renovate's configMigration PR confirm the rendered config; review the first post-merge Renovate run.
- **`docker:enableMajor` / `customManagers:dockerfileVersions` are no-ops now but auto-activate if a Dockerfile is ever added** — intended future-proofing, but means future Dockerfiles get major-version Docker PRs without further opt-in. Accepted.
- **npm release-age re-assertion ordering** — the trailing npm `packageRule` (14d) must stay ordered after the bundled `security:minimumReleaseAgeNpm` rule it counters; user `packageRules` merge after preset rules so it wins. Verified the migrated config keeps npm at 14 days.
- **`bunx` downloads `renovate` (a large package) on each CI run with no cache** → Mitigation: acceptable for now (PR-only, runs in parallel with nothing); a bun cache step can be added later if it proves slow.
- **`security:openssf-scorecard` adds a datasource lookup per dependency** → minor PR-body enrichment cost; no functional risk.

## Migration Plan

1. Edit `renovate.json` (extends, remove redundant `configMigration`, raise `minimumReleaseAge` + npm re-assertion, add `vulnerabilityAlerts`, add `bunx -p` customManager).
2. Add the lint-staged entry and the standalone `.github/workflows/renovate-config-validator.yml`.
3. Validate the *new* config locally with `bunx --package renovate@43.227.0 renovate-config-validator --strict renovate.json` before committing.
4. Open the PR; the path-filtered workflow re-validates. Merge to `main`.
5. Watch the next scheduled Renovate run / Dependency Dashboard for config-migration or validation errors.

**Rollback:** revert `renovate.json`, `lint-staged.config.ts`, `.github/workflows/renovate-config-validator.yml`, and the `ci.yml` step removal — no state or migration to unwind.

## Open Questions

- Exact pinned `renovate` version — resolved at implementation time to the then-current release.
- Whether the local lint-staged invocation should also pass `--strict` (CI does). Default: mirror CI and use `--strict` locally too, unless it proves noisy.
