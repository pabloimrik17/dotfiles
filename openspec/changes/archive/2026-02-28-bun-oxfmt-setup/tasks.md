## 1. Bun Initialization

- [x] 1.1 Run `bun init` to create `package.json` with `"type": "module"` and `"private": true`
- [x] 1.2 Update `.gitignore` to include `node_modules/`
- [x] 1.3 Install all devDependencies: `bun add -D oxfmt husky lint-staged @commitlint/cli @commitlint/config-conventional @commitlint/types`
- [x] 1.4 Add scripts to `package.json`: `"prepare": "husky"`, `"lint:oxfmt": "oxfmt --check"`, `"lint:oxfmt:fix": "oxfmt"`

## 2. oxfmt Configuration

- [x] 2.1 Create oxfmt config file with `tabWidth: 4`, `useTabs: false`, `singleAttributePerLine: true`
- [x] 2.2 Create `.oxfmtignore` excluding `openspec/`, `.claude/`, `.codex/`, `.opencode/`, `.husky/_/`

## 3. Husky and Git Hooks

- [x] 3.1 Run `bunx husky init` to initialize the `.husky/` directory
- [x] 3.2 Create `.husky/pre-commit` hook: `bunx lint-staged --config lint-staged.config.ts`
- [x] 3.3 Create `.husky/commit-msg` hook: `bunx commitlint --edit $1`

## 4. lint-staged Configuration

- [x] 4.1 Create `lint-staged.config.ts` with oxfmt wired to all files via `--no-error-on-unmatched-pattern`, using `satisfies Configuration`

## 5. commitlint Configuration

- [x] 5.1 Create `commitlint.config.ts` extending `@commitlint/config-conventional`, typed with `UserConfig` from `@commitlint/types`

## 6. Verification

- [x] 6.1 Run `bun run lint:oxfmt` to verify check mode works
- [x] 6.2 Run `bun run lint:oxfmt:fix` to format all existing files
- [x] 6.3 Test commit-msg hook with an invalid message (expect rejection)
- [x] 6.4 Test commit-msg hook with a valid conventional commit (expect success)
- [x] 6.5 Verify `bun.lock` is tracked (not in `.gitignore`)
