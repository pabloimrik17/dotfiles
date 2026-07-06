# Delta: fallow-project-config

## ADDED Requirements

### Requirement: fallow is an exact-pinned devDependency

`package.json` SHALL declare `fallow` as a devDependency with an exact version (no range), consistent with the repo's other tool CLIs (commitlint, lint-staged, oxfmt), so Renovate manages it and the CI action reads it as its version source.

#### Scenario: Dependency installed

- **WHEN** `bun install --frozen-lockfile` runs
- **THEN** `node_modules/.bin/fallow` exists and `bunx fallow --version` reports the pinned version

### Requirement: Repo-tuned fallow configuration

The repo SHALL contain a `.fallowrc.jsonc` at the root with: a local `$schema` (`./node_modules/fallow/schema.json`, version-matched to the pinned devDep), `oxfmt.config.ts` declared as an `entry` (no built-in fallow plugin covers oxfmt, unlike commitlint/lint-staged), `ignorePatterns` covering the non-JS chezmoi surface (`**/*.tmpl`, `dot_config/**`, `dot_claude/**`, `dot_local/**`, `Library/**`, `assets/**`, `docs/**`, `openspec/**`), `ignoreDependencies` for `@types/bun`, `unused-exports`/`unused-types` set to `off`, and `require-suppression-reason` set to `warn`. The `.fallow/` analysis cache SHALL be gitignored.

#### Scenario: Clean analysis on untouched repo

- **WHEN** `bunx fallow` runs on a clean checkout
- **THEN** it reports no unused-file findings (config files are entries or plugin-detected, chezmoi surface is ignored)

#### Scenario: Config discovered by CLI

- **WHEN** `bunx fallow config --path` runs at the repo root
- **THEN** it prints the path to `.fallowrc.jsonc`

#### Scenario: Config file survives the formatter

- **WHEN** lint-staged runs oxfmt over a commit touching `.fallowrc.jsonc`
- **THEN** the file remains valid JSONC (via oxfmt handling it correctly or an `.oxfmtignore` entry)

#### Scenario: Analysis cache stays out of git

- **WHEN** fallow runs locally and creates its `.fallow/` cache directory
- **THEN** `git status` does not report it (covered by `.gitignore`)

### Requirement: lint:fallow package script

`package.json` SHALL provide a `lint:fallow` script that runs `fallow audit`, mirroring the `lint:oxfmt` naming convention.

#### Scenario: Local audit run

- **WHEN** the user runs `bun run lint:fallow` on a feature branch
- **THEN** `fallow audit` executes against files changed since the base ref using the repo config
