## 1. Renovate policy

- [x] 1.1 Enable osvVulnerabilityAlerts, narrow the npm rule to major/minor, and add the global patch rule with the exact design descriptions; verify the diff preserves schedules, presets, grouping, custom managers and vulnerability limit overrides.
- [x] 1.2 Verify resolved Renovate behavior for npm major/minor (14 days), patches across datasources (3 days), preset-exempt pin/replacement/lockFileMaintenance updates (null with notes), inherited npm bump/lockfileUpdate/rollback behavior (3 days), weekly lockfile maintenance and security bypass; record evidence in Beads.

## 2. Bun policy

- [x] 2.1 Add repository bunfig.toml with install.minimumReleaseAge = 86400 and no exclusions; verify TOML parsing and chezmoi source mapping, excluding the repository-only file from deployment if needed.
- [x] 2.2 Audit locked dependency lifecycle scripts using Bun 1.3.14 and declare only required trustedDependencies (expected empty); verify root Husky prepare remains enabled and any lockfile change is limited to trust metadata.

## 3. Integrated validation

- [x] 3.1 Run a clean isolated frozen-lockfile install with Bun 1.3.14 and an empty dedicated cache; verify the lockfile does not change and fallow, oxfmt, lint-staged and commitlint work, with the root prepare behavior checked in an isolated Git repository.
- [x] 3.2 Probe Bun 1.3.14 new-resolution age rejection deterministically outside the repository; verify a too-young version is blocked and document the existing-lockfile limitation and explicit-empty-trust behavior.
- [x] 3.3 Run bunx --package renovate@43.227.0 renovate-config-validator --strict renovate.json, relevant formatting/fallow/test checks, and openspec validate harden-dependency-policy --strict; distinguish pre-existing failures and record exact commands and results.

## 4. Handoff

- [x] 4.1 Review the final diff for unrelated changes and record implementation, checks, remaining PR/CI acceptance, worktree and AoE session in the shared Beads task; verify conflict-free Dolt publication without committing or pushing repository code.
