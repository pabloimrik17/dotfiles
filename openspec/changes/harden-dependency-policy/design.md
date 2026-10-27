## Context

See proposal.md for motivation. Current config has a blanket npm 14-day rule, no OSV opt-in, and no bunfig.toml or trustedDependencies. Bun is pinned to 1.3.14 in both packageManager and .bun-version; the local shell runs 1.4.2. CI and lint-staged pin Renovate 43.227.0. Existing renovate-config specs require a blanket npm floor: the delta intentionally replaces that requirement with the agreed differentiated policy.

Inspection of 86 installed package manifests found no preinstall/install/postinstall scripts. Seven packages declare prepare scripts for package publication (y18n, yargs-parser, get-caller-file, cliui, yargs, cosmiconfig, tinyexec). These are not evidence that registry consumers require installation scripts. Fallow, oxfmt and TypeScript declare platform-specific optional packages. A clean installation must confirm that these shipped binaries work with explicit empty trust.

## Goals / Non-Goals

**Goals:** Make the effective inherited policy auditable and verify it using the pinned runtime, without disturbing parallel changes.

**Non-Goals:** Runtime or dependency upgrades, changes to existing scheduling or unrelated presets, transitive CVE scanning, or repository publishing in this planning turn.

## Decisions

### Preserve inheritance and narrow the npm override

Keep existing presets and weekly lockfile maintenance. Replace the broad npm override after the schedule rules with these two rules, using the approved descriptions verbatim:

```json
[
    {
        "description": "security:minimumReleaseAgeNpm (via config:best-practices) sets npm to 3 days; restore 14 for majors and minors",
        "matchDatasources": ["npm"],
        "matchUpdateTypes": ["major", "minor"],
        "minimumReleaseAge": "14 days"
    },
    {
        "description": "Patches wait 3 days, never below Bun's minimumReleaseAge (bunfig.toml)",
        "matchUpdateTypes": ["patch"],
        "minimumReleaseAge": "3 days"
    }
]
```

A blanket npm override overwrites inherited exemptions; dropping the preset also loses its notes. Retain vulnerabilityAlerts limit overrides and inherited security age bypass. Enable OSV independently of Dependabot. Preserve every other setting, including Scorecard, grouping and custom managers.

Renovate 43.227.0 provides null-age exemptions and PR notes for pin, replacement, and lockFileMaintenance. Preserve those three exemptions. Its npm bump, lockfileUpdate, and rollback rules retain the inherited 3-day age without exemption notes; do not add local exemptions for these operations.

### Configure resolution and installation separately

Add `[install] minimumReleaseAge = 86400` in repository bunfig.toml with no exclusions. Check chezmoi source mapping and exclude this tooling file if it would be deployed to HOME. Declare `trustedDependencies: []` based on the observed absence of required install scripts, subject to verification using Bun 1.3.14. Do not disable all scripts: the root prepare hook must continue working. Update lock trust metadata only if required; never refresh unrelated resolutions.

### Verification must distinguish age enforcement from reproducibility

Verification with Bun 1.3.14 found that an empty trust list in package.json blocks scripts on initial resolution, but its generated lockfile omits the empty list and a subsequent frozen install restores default trust. Preserve `"trustedDependencies": []` explicitly in bun.lock as well. A controlled registry fixture verified that this blocks a default-trusted package's script on frozen reinstall and survives a normal no-change install. This is a trust-metadata-only change; dependency resolutions remain unchanged. Recheck this behavior when regenerating the lockfile or upgrading Bun.

Use Bun 1.3.14 in an isolated installation with no node_modules and a dedicated empty cache; preserve this worktree's installed packages. Run frozen install and smoke checks for fallow, oxfmt, lint-staged and commitlint, plus relevant repository tests. Separately verify resolution-age rejection with a controlled temporary registry fixture or equivalent deterministic probe. An existing lockfile is exempt from new-resolution filtering, so frozen install alone is insufficient evidence. Inspect effective Renovate settings for major, minor, patch, exempt update types and security updates, and run `bunx --package renovate@43.227.0 renovate-config-validator --strict renovate.json` under the intended runtime. Any validator failure must be diagnosed without opportunistic version upgrades.

## Risks / Trade-offs

- Locked versions bypass Bun's new-resolution age filter → document this boundary; security fixes newly resolved by Bun remain subject to the one-day floor, but do not claim that already locked fixes are rechecked.
- Current Bun docs describe a newer runtime → verify empty-trust semantics and age behavior under 1.3.14; report incompatibility before changing runtime policy.
- Bun 1.3.14 drops the empty trust list from bun.lock whenever it regenerates the lockfile, including Renovate's weekly lock-file maintenance → accepted without a CI guard; no locked package declares install scripts. Restore the entry when reviewing Renovate bun.lock changes; recheck on a Bun upgrade.
- OSV integration is experimental and direct-dependency-only → do not describe it as a transitive scanner.
- Existing formatting or test failures may be unrelated → record baseline and avoid editing parallel work.
- PR and green CI remain part of the Beads acceptance criteria → leave the task open until authorized publishing and CI complete.

## Migration Plan

Apply the small config changes after review, validate locally, and record exact evidence in Beads. No commit or push without explicit user authorization. Publish shared task data through the authoritative tracker. Rollback consists of reverting only this change's config edits; no dependency migration is required.

## Primary References

Reviewed 2026-10-25:

- https://docs.renovatebot.com/presets-security/#securityminimumreleaseagenpm
- https://docs.renovatebot.com/configuration-options/#osvvulnerabilityalerts
- https://docs.renovatebot.com/configuration-options/#vulnerabilityalerts
- https://bun.sh/docs/pm/cli/install#minimum-release-age
- https://bun.sh/docs/pm/lifecycle#behavior-of-the-trusteddependencies-field
