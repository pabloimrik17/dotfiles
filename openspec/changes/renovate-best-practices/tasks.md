## 1. Pin the Renovate version

- [ ] 1.1 Determine the current `renovate` npm release at implementation time and use it as `<ver>` everywhere below (CI, lint-staged, customManager match). The issue's `40.0.0` is illustrative only.

## 2. Update `renovate.json` extends

- [ ] 2.1 Replace `config:recommended` with `config:best-practices` in `extends`.
- [ ] 2.2 Remove presets now subsumed by `config:best-practices`: drop `:dependencyDashboard` from `extends` and remove the redundant top-level `"configMigration": true`.
- [ ] 2.3 Confirm `:semanticCommits` and `:enableVulnerabilityAlertsWithLabel(security)` remain in `extends` (not bundled by best-practices).
- [ ] 2.4 Add the hardening presets to `extends`: `:enablePreCommit`, `security:openssf-scorecard`, `docker:enableMajor`, `customManagers:githubActionsVersions`, `customManagers:dockerfileVersions`.

## 3. Vulnerability throttling override

- [ ] 3.1 Add a top-level `vulnerabilityAlerts` object with `"prHourlyLimit": 0` and `"prConcurrentLimit": 0`.
- [ ] 3.2 Leave the routine global `prConcurrentLimit: 10` / `prHourlyLimit: 2` unchanged.

## 4. CustomManager for the pinned validator

- [ ] 4.1 Add a regex `customManager` matching the `bunx (?:--package|-p) <pkg>@<ver>` invocation shape, with `datasourceTemplate: "npm"`, covering `^\.github/workflows/.+\.ya?ml$` and `^lint-staged\.config\.ts$`.
- [ ] 4.2 Verify the four existing customManagers (opencode.json, .mcp.json, CI `pnpm dlx|bunx|npx`, install script) are untouched.

## 5. Local validation (husky + lint-staged)

- [ ] 5.1 Add a `"renovate.json"` entry to `lint-staged.config.ts` running `bunx --package renovate@<ver> renovate-config-validator --strict`.
- [ ] 5.2 Keep the existing `"*": "oxfmt ..."` entry; do not modify `.husky/pre-commit`.

## 6. CI validation step

- [ ] 6.1 Add a `Validate Renovate config` step to `.github/workflows/ci.yml` running `bunx --package renovate@<ver> renovate-config-validator --strict`.
- [ ] 6.2 Place it after the existing steps in the `main` job (Bun is already set up by `oven-sh/setup-bun@v2`).

## 7. Verify

- [ ] 7.1 Run `bunx --package renovate@<ver> renovate-config-validator --strict renovate.json` locally against the new config — it must pass.
- [ ] 7.2 Stage `renovate.json` and run a commit to confirm the lint-staged validator entry fires; stage an unrelated file to confirm it does NOT fire.
- [ ] 7.3 Temporarily introduce a config error and confirm both the local hook and `renovate-config-validator --strict` reject it; revert.
- [ ] 7.4 After merge, watch the next scheduled Renovate run / Dependency Dashboard for config-migration or validation errors.
