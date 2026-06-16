## Context

`renovate.json` currently extends `config:recommended` plus `:dependencyDashboard`, `:semanticCommits`, and `:enableVulnerabilityAlertsWithLabel(security)`. The repo is a chezmoi-managed dotfiles repo using **bun** (CLAUDE.md mandate), with git hooks via **husky + lint-staged + commitlint** and a single CI workflow (`.github/workflows/ci.yml`). There is no Dockerfile and no `.pre-commit-config.yaml`.

GitHub issue #140 asks to move to `config:best-practices`, add hardening presets, unthrottle security PRs, and add config validation. The issue's examples assume **prek + pnpm**; this design reconciles them to the repo's actual **husky/lint-staged + bun** stack (confirmed with the user).

## Goals / Non-Goals

**Goals:**

- Adopt `config:best-practices` as the base preset; remove presets it already bundles.
- Add the hardening presets from the issue (`:enablePreCommit`, `security:openssf-scorecard`, `docker:enableMajor`, `customManagers:githubActionsVersions`, `customManagers:dockerfileVersions`).
- Add a `vulnerabilityAlerts` block that zeroes the hourly/concurrent PR limits.
- Validate the Renovate config at commit time (lint-staged) and PR time (CI), against a pinned `renovate` version that Renovate itself bumps.

**Non-Goals:**

- No change to `rangeStrategy: pin`, the monthly `packageRules` schedules, `minimumReleaseAge`, reviewers/labels, or the existing MCP/CLI/install-script customManagers.
- No introduction of prek or any second pre-commit framework.
- No addition of `renovate` to `package.json` devDependencies.

## Decisions

**1. `config:best-practices` + prune subsumed presets.**
Replace `config:recommended` with `config:best-practices`. `config:best-practices` transitively enables `config:recommended`, `:dependencyDashboard`, digest pinning, `:configMigration`, `:pinDevDependencies`, `abandonments:recommended`, and `security:minimumReleaseAgeNpm`, so any of those listed explicitly become noise and are removed (in our config that means dropping `:dependencyDashboard` and the top-level `configMigration: true`, both now redundant). Keep `:semanticCommits` and `:enableVulnerabilityAlertsWithLabel(security)` — neither is bundled. The `renovate-config-validator` and Renovate's own `:configMigration` PRs are the safety net that confirms nothing required was dropped.
*Alternative rejected:* keep `config:recommended` and hand-list each best-practice preset — that is exactly the maintenance noise the preset exists to remove.

**2. Validator via `bunx --package renovate@<ver> renovate-config-validator` (verified on bun 1.3.10).**
`renovate-config-validator` is a binary inside the `renovate` package, so the eponymous `bunx renovate@<ver>` form won't reach it — `--package`/`-p` is required. The pinned version is invoked on demand; bun caches it globally. We do NOT add `renovate` to `devDependencies` (it's large and only needed for validation).
*Alternative rejected:* `devDependencies` entry — bloats install for a validation-only tool; on-demand bunx + the self-bumping customManager covers it.

**3. Local validation as a `renovate.json`-scoped lint-staged entry.**
Add `"renovate.json": "bunx --package renovate@<ver> renovate-config-validator"` to `lint-staged.config.ts`. lint-staged only runs it when `renovate.json` is staged and appends the staged path as the file argument, so it self-scopes. Runs through the existing `.husky/pre-commit` → `bunx lint-staged` chain; no `.husky/` script change.
*Note:* `:enablePreCommit` is still added to `extends` per the issue, even though it's a no-op today (no `.pre-commit-config.yaml`). It documents intent and activates automatically if prek is ever adopted.

**4. CI validation as a step in the existing `ci.yml`, `--strict`.**
A `Validate Renovate config` step runs `bunx --package renovate@<ver> renovate-config-validator --strict` after the existing steps. Runs on every PR (not path-filtered) — the validator is fast and the simpler single-workflow shape was chosen over a dedicated path-filtered workflow.

**5. Additive `bunx -p` customManager.**
The existing `(?:pnpm dlx|bunx|npx) <pkg>@<ver>` regex does not match the `bunx -p <pkg>@<ver> <bin>` shape (version sits after the `-p` token, before the binary name). Add a complementary regex customManager matching `bunx (?:--package|-p) <pkg>@<ver>` with `datasourceTemplate: npm`, covering `.github/workflows/*.yml` and `lint-staged.config.ts`. The existing four customManagers are untouched.

**6. Pinned version chosen at implementation time.**
Pin to the current `renovate` release when implementing (the issue's `40.0.0` is illustrative). The customManager keeps it current thereafter.

## Risks / Trade-offs

- **Dropping a preset that best-practices does NOT actually bundle → silent behavior loss.** → Mitigation: only `:dependencyDashboard` and `configMigration` are pruned (both documented as part of recommended/best-practices); validator + Renovate's configMigration PR confirm the rendered config; review the first post-merge Renovate run.
- **`docker:enableMajor` / `customManagers:dockerfileVersions` are no-ops now but auto-activate if a Dockerfile is ever added** — intended future-proofing, but means future Dockerfiles get major-version Docker PRs without further opt-in. Accepted.
- **`:enablePreCommit` auto-enables Renovate's pre-commit manager if a `.pre-commit-config.yaml` later appears** — could surface unexpected PRs. Low risk; accepted.
- **`bunx` downloads `renovate` (a large package) on each CI run with no cache** → Mitigation: acceptable for now (PR-only, runs in parallel with nothing); a bun cache step can be added later if it proves slow.
- **`security:openssf-scorecard` adds a datasource lookup per dependency** → minor PR-body enrichment cost; no functional risk.

## Migration Plan

1. Edit `renovate.json` (extends, remove redundant `configMigration`, add `vulnerabilityAlerts`, add `bunx -p` customManager).
2. Add the lint-staged entry and the `ci.yml` step.
3. Validate the *new* config locally with `bunx --package renovate@<ver> renovate-config-validator --strict renovate.json` before committing.
4. Open the PR; CI re-validates. Merge to `main`.
5. Watch the next scheduled Renovate run / Dependency Dashboard for config-migration or validation errors.

**Rollback:** revert the three files (`renovate.json`, `lint-staged.config.ts`, `.github/workflows/ci.yml`) — no state or migration to unwind.

## Open Questions

- Exact pinned `renovate` version — resolved at implementation time to the then-current release.
- Whether the local lint-staged invocation should also pass `--strict` (CI does). Default: mirror CI and use `--strict` locally too, unless it proves noisy.
