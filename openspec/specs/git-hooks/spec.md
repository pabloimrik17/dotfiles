# Capability: git-hooks

## Purpose

Git hook management — Husky setup, pre-commit formatting via lint-staged, and commit-msg validation via commitlint.

## Requirements

### Requirement: Husky manages git hooks

The repo SHALL use Husky 9 for git hook management. The `.husky/` directory SHALL contain hook scripts.

#### Scenario: Husky directory exists

- **WHEN** the repo is set up (after `bun install`)
- **THEN** a `.husky/` directory exists with `pre-commit` and `commit-msg` hook files

### Requirement: Pre-commit hook runs lint-staged

The pre-commit hook SHALL execute lint-staged to format staged files using oxfmt.

#### Scenario: Staged files are formatted on commit

- **WHEN** a developer runs `git commit`
- **THEN** the pre-commit hook executes `bunx lint-staged --config lint-staged.config.ts`
- **THEN** only staged files are passed through oxfmt

#### Scenario: Commit blocked if formatting fails

- **WHEN** lint-staged encounters an error (e.g., oxfmt exits non-zero)
- **THEN** the commit is aborted

### Requirement: lint-staged configuration

The repo SHALL have a `lint-staged.config.ts` file that wires oxfmt to all staged files.

#### Scenario: All files pass through oxfmt

- **WHEN** lint-staged runs
- **THEN** all staged files are processed by `oxfmt --no-error-on-unmatched-pattern`

#### Scenario: lint-staged config is TypeScript

- **WHEN** `lint-staged.config.ts` is inspected
- **THEN** it exports a configuration object using the `Configuration` type from `lint-staged` and the `satisfies` keyword

### Requirement: Commit-msg hook runs commitlint

The commit-msg hook SHALL execute commitlint to validate the commit message.

#### Scenario: Commit message is validated

- **WHEN** a developer runs `git commit`
- **THEN** the commit-msg hook executes `bunx commitlint --edit $1`

#### Scenario: Invalid commit message blocks commit

- **WHEN** a commit message does not conform to conventional commits format
- **THEN** the commit is aborted with a commitlint error

### Requirement: Hooks use bunx

All hook scripts SHALL use `bunx` to invoke tools, consistent with Bun as the project runtime.

#### Scenario: Hook invocation uses bunx

- **WHEN** `.husky/pre-commit` and `.husky/commit-msg` are inspected
- **THEN** they use `bunx` (not `npx`, `pnpm exec`, or `node`)
