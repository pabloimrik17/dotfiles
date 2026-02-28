## Why

The dotfiles repo has no JS tooling, no formatter, and no git hook discipline. Adding oxfmt (Prettier-compatible, 30x faster) as a universal formatter for JSON, TOML, YAML, and Markdown — plus commit message validation — brings the same quality guardrails that monolab has, adapted for a config-focused repo. Bun is the runtime choice for speed and native TS execution without hacks.

## What Changes

- Initialize Bun as the JavaScript runtime (`package.json`, `bun.lock` tracked)
- Install oxfmt as the code formatter with `lint:oxfmt` and `lint:oxfmt:fix` package scripts
- Install Husky 9 for git hooks management
- Add pre-commit hook running lint-staged with oxfmt on staged files
- Add commit-msg hook running commitlint with conventional commits validation
- Add lint-staged config (TypeScript) wiring oxfmt to all staged files
- Add commitlint config (TypeScript) extending `@commitlint/config-conventional`
- Add oxfmt config with formatting preferences aligned to monolab conventions (tabWidth 4, spaces)
- Add oxfmt ignore rules for openspec, agent config directories, and other non-formattable paths
- Update `.gitignore` to include `node_modules/`

## Capabilities

### New Capabilities

- `bun-init`: Bun runtime initialization — `package.json` with `type: module`, scripts, and devDependencies
- `oxfmt-formatting`: oxfmt formatter configuration, ignore rules, and package scripts (`lint:oxfmt`, `lint:oxfmt:fix`)
- `git-hooks`: Husky setup with pre-commit (lint-staged + oxfmt) and commit-msg (commitlint) hooks
- `commit-validation`: commitlint configuration enforcing conventional commits standard

### Modified Capabilities

None — all new, no existing specs.

## Impact

- **New files**: `package.json`, `bun.lock`, `commitlint.config.ts`, `lint-staged.config.ts`, `.husky/pre-commit`, `.husky/commit-msg`, oxfmt config/ignore
- **Modified files**: `.gitignore` (add `node_modules/`)
- **New devDependencies**: `oxfmt`, `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional`, `@commitlint/types`
- **Runtime requirement**: Bun (already installed globally at v1.3.5)
- **Zero impact** on chezmoi-managed dotfiles or the existing `setup-dotfiles` change
