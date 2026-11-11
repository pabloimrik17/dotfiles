## ADDED Requirements

### Requirement: Bun applies a repository release-age floor

Repository-local `bunfig.toml` SHALL set `[install].minimumReleaseAge` to `86400` seconds. New dependency resolution SHALL use this floor for direct and transitive packages with publication timestamps. Existing locked versions SHALL remain unchanged by this policy. Routine Renovate major/minor and patch ages SHALL be at least the Bun floor. No standing age exclusion SHALL be added.

#### Scenario: New version is too young

- **WHEN** Bun resolves a version published less than 86400 seconds ago
- **THEN** that version is rejected by the age policy

#### Scenario: Locked installation remains reproducible

- **WHEN** Bun 1.3.14 performs a clean frozen-lockfile installation
- **THEN** existing locked versions install without a dependency upgrade or lockfile rewrite

#### Scenario: Emergency exception is temporary

- **WHEN** an actively exploited critical vulnerability requires an age exclusion
- **THEN** the exception is explicitly reviewed and has a follow-up task to remove it

### Requirement: Dependency lifecycle trust is explicit

`package.json` SHALL declare only dependencies whose installation lifecycle scripts are required for repository tooling in `trustedDependencies`, using an empty array when none are needed. When the list is empty, `bun.lock` SHALL record `"trustedDependencies": []` as well. The project-level Husky prepare script SHALL remain enabled. Trust SHALL be verified with the pinned Bun version and a clean frozen-lockfile installation that confirms dependency lifecycle scripts remain blocked while the root `prepare` script remains enabled.

#### Scenario: No dependency install scripts are required

- **WHEN** the locked dependency script inventory and tool smoke checks show no required dependency lifecycle scripts
- **THEN** the explicit trust list is empty
- **AND** formatting, linting, and commit tooling remain usable

#### Scenario: A dependency script is necessary

- **WHEN** a required tool cannot work without its dependency installation script
- **THEN** only the justified dependency is trusted and the reason is recorded
