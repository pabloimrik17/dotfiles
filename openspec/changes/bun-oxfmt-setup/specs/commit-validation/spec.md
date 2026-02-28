## ADDED Requirements

### Requirement: Conventional commits enforcement

The repo SHALL enforce the conventional commits standard on all commit messages using commitlint with the `@commitlint/config-conventional` preset.

#### Scenario: Valid conventional commit accepted

- **WHEN** a commit message follows the format `type(scope?): description` (e.g., `feat: add oxfmt formatting`, `fix(hooks): correct husky init`)
- **THEN** commitlint passes and the commit succeeds

#### Scenario: Invalid commit message rejected

- **WHEN** a commit message does not follow conventional commits format (e.g., `added stuff`)
- **THEN** commitlint rejects the message and the commit is aborted

#### Scenario: All conventional commit types accepted

- **WHEN** a commit uses any standard type (`feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`)
- **THEN** commitlint accepts the message

### Requirement: commitlint configuration

The repo SHALL have a `commitlint.config.ts` file in TypeScript that extends the conventional config.

#### Scenario: Config extends conventional preset

- **WHEN** `commitlint.config.ts` is inspected
- **THEN** it exports a `UserConfig` that extends `@commitlint/config-conventional`

#### Scenario: Config uses TypeScript with type safety

- **WHEN** `commitlint.config.ts` is inspected
- **THEN** it imports `UserConfig` from `@commitlint/types` and uses proper typing
