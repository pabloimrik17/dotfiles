## ADDED Requirements

### Requirement: Bun-initialized project

The repo SHALL have a `package.json` at root with `"type": "module"` and Bun as the JavaScript runtime. The `bun.lock` file SHALL be tracked in git.

#### Scenario: package.json exists with correct structure

- **WHEN** the repo is cloned
- **THEN** `package.json` exists at root with `"type": "module"`, a `"name"` field, and a `"private": true` field

#### Scenario: bun.lock is tracked

- **WHEN** `bun install` is run
- **THEN** `bun.lock` is generated and tracked in version control (not in `.gitignore`)

#### Scenario: node_modules is ignored

- **WHEN** `bun install` is run
- **THEN** `node_modules/` is listed in `.gitignore` and not tracked

### Requirement: Prepare script installs hooks

The `package.json` SHALL include a `"prepare"` script that runs `husky` to set up git hooks on install.

#### Scenario: Hooks installed on bun install

- **WHEN** a developer runs `bun install`
- **THEN** the `prepare` script executes `husky` and git hooks are configured in `.husky/`

### Requirement: Formatting scripts

The `package.json` SHALL include `"lint:oxfmt"` and `"lint:oxfmt:fix"` scripts.

#### Scenario: Check formatting without writing

- **WHEN** `bun run lint:oxfmt` is executed
- **THEN** oxfmt runs in check mode (`oxfmt --check`) and exits non-zero if files are unformatted

#### Scenario: Fix formatting

- **WHEN** `bun run lint:oxfmt:fix` is executed
- **THEN** oxfmt formats all supported files in-place

### Requirement: DevDependencies

The `package.json` SHALL declare all tooling as `devDependencies`: `oxfmt`, `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional`, `@commitlint/types`.

#### Scenario: All tools are dev dependencies

- **WHEN** `package.json` is inspected
- **THEN** the `devDependencies` object contains `oxfmt`, `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional`, and `@commitlint/types`
