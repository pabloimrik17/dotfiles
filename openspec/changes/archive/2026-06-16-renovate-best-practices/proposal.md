## Why

Renovate's own docs recommend `config:best-practices` over `config:recommended` — it bundles safety/hygiene presets (digest pinning, config migration, dev-dependency pinning, abandonment flagging, npm minimum-release-age) that we'd otherwise have to wire by hand. We currently extend `config:recommended`, so we miss those rules. We also have no guardrail against shipping a broken `renovate.json`: a typo only surfaces on the next Renovate cron run, hours later. This change adopts the best-practices baseline, adds a few hardening presets, unblocks security PRs from global throttling, and validates the config at commit/PR time.

## What Changes

- **Switch base preset** `config:recommended` → `config:best-practices` in `renovate.json`, and drop any presets now subsumed by it (e.g. `:dependencyDashboard`, which best-practices already enables). Keep presets best-practices does *not* include: `:semanticCommits`, `:enableVulnerabilityAlertsWithLabel(security)`.
- **Add hardening presets** to `extends`: `security:openssf-scorecard`, `docker:enableMajor`, `customManagers:githubActionsVersions`, `customManagers:dockerfileVersions`. `docker:enableMajor` and `customManagers:dockerfileVersions` are no-ops while no Dockerfile exists — safe future-proofing. `:enablePreCommit` is intentionally **not** added: the repo has no `.pre-commit-config.yaml`, so the preset is inert (aligned with the monolab migration).
- **Preserve a strict npm release-age floor.** `config:best-practices` bundles `security:minimumReleaseAgeNpm` (a 3-day npm `packageRule`) which would override the top-level `minimumReleaseAge` for npm packages. Bump the top-level floor to `14 days` and add a trailing npm `packageRule` re-asserting `14 days` so the preset cannot silently shorten it.
- **Unblock vulnerability PRs** from the global `prHourlyLimit: 2` / `prConcurrentLimit: 10` by adding a `vulnerabilityAlerts` block with both limits set to `0` (unlimited). A CVE fix should never queue behind routine chore PRs.
- **Add a customManager** for the `bunx --package <pkg>@<ver> <cmd>` form so Renovate can bump the pinned validator version. The existing `pnpm dlx|bunx|npx <pkg>@<ver>` regex does not match the `--package`/`-p` shape.
- **Wire `renovate-config-validator`** (pinned to a fixed `renovate@<ver>`, run via `bunx`):
  - **CI**: a standalone, path-filtered workflow `.github/workflows/renovate-config-validator.yml` that runs `--strict` only when a Renovate config file changes.
  - **Local**: a `renovate.json`-scoped entry in `lint-staged.config.ts`, executed by the existing husky `pre-commit` hook. No new pre-commit framework (prek) is introduced.

Non-goals: this change does not migrate `rangeStrategy` or the monthly `packageRules` schedules, and preserves the existing MCP/CLI customManagers' matching logic (only their `fileMatch` keys migrate to `managerFilePatterns`).

## Capabilities

### New Capabilities

- `renovate-config`: The Renovate bot configuration for this repo — the preset baseline (`config:best-practices` + hardening presets), the `vulnerabilityAlerts` throttling override, the `bunx --package` customManager, and the pinned `renovate-config-validator` CI step that validates the config on every PR.

### Modified Capabilities

- `git-hooks`: The `lint-staged.config.ts` requirement gains a second, path-scoped entry — `renovate-config-validator` runs against `renovate.json` (only) through the existing husky `pre-commit` hook, alongside the existing oxfmt-on-all-files entry.

## Impact

- **Config**: `renovate.json` (extends, `minimumReleaseAge` 14d + npm re-assertion `packageRule`, `vulnerabilityAlerts`, `customManagers`).
- **CI**: new `.github/workflows/renovate-config-validator.yml` (path-filtered).
- **Local hooks**: `lint-staged.config.ts` (new scoped entry); no change to `.husky/` scripts.
- **Dependencies**: introduces a pinned `renovate@<ver>` invoked on-demand via `bunx` (CI + lint-staged); not added to `package.json` devDependencies. Renovate self-bumps it via the new customManager.
- **Behavioral**: security PRs become unthrottled; major Docker updates and OpenSSF scorecard surfacing become active if/when relevant files appear; broken Renovate config is rejected at commit and PR time.
