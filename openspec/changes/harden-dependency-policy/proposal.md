## Why

Dependency updates need a consistent settling period and an independent vulnerability feed. The current broad npm age override also suppresses preset exemptions, while Bun has no repository release-age policy.

## What Changes

- Enable Renovate OSV vulnerability alerts for supported direct dependencies.
- Keep the 14-day default; scope the npm 14-day override to major/minor updates and use a separate 3-day patch rule across datasources, preserving preset exemptions and notes.
- Add repository-local Bun install minimumReleaseAge of 86400 seconds.
- Review dependency lifecycle scripts and declare only required trusted dependencies, validating an explicit empty list if none are needed.
- Preserve weekly lockfile maintenance, existing schedules, security bypasses, and unrelated settings.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `renovate-config`: Enable OSV alerts and refine release ages without overriding preset exemptions.
- `bun-init`: Add the install age floor and explicit lifecycle-script trust policy.

## Impact

Expected implementation files: `renovate.json`, new `bunfig.toml`, `package.json`, and `bun.lock` only if trust metadata changes. Check whether `.chezmoiignore` must exclude the repository-only Bun config. No dependency upgrades, runtime upgrades, scanner rollout, or unrelated preset changes are included. Validate with the repository-pinned Renovate validator and Bun 1.3.14; the shell currently runs Bun 1.4.2. Publishing repository code and opening a PR remain subject to explicit authorization.
