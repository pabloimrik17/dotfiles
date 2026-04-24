## 1. Update chezmoi source

- [x] 1.1 Add the `[step.copy-ignored]` section with `exclude` array to `dot_config/worktrunk/config.toml`, placed after the `[pre-start]` / `[post-start]` blocks and before `[commit.generation]`
- [x] 1.2 Include the full exclude list: `node_modules/`, `.next/`, `.nx/`, `.turbo/`, `.expo/`, `.cache/`, `.parcel-cache/`, `.vite/`, `.swc/`, `dist/`, `build/`, `out/`, `storybook-static/`, `coverage/`, `.nyc_output/`, `htmlcov/`, `playwright-report/`, `test-results/`, `__pycache__/`, `.pytest_cache/`, `.mypy_cache/`, `.ruff_cache/`, `.venv/`, `venv/`
- [x] 1.3 Add an inline TOML comment above the `exclude` array explaining the rationale (regenerable via `deps` hook, rebuilds regenerate caches, absolute paths in venvs break after copy)
- [x] 1.4 Verify `.idea/` and `ios/Pods/` are NOT in the exclude list

## 2. Verify chezmoi integration

- [x] 2.1 Run `chezmoi diff` and confirm the only change to `~/.config/worktrunk/config.toml` is the new `[step.copy-ignored]` block
- [x] 2.2 Run `chezmoi apply` and confirm no errors and no unintended drift in other files
- [x] 2.3 Run `wt config show` and confirm the `[step.copy-ignored].exclude` list matches the source

## 3. Functional verification on a Node project

- [x] 3.1 In a project with populated `node_modules/` and `.next/`, run `wt switch --create <test-branch>`
- [x] 3.2 Before `[post-start].deps` completes, confirm the new worktree has no `node_modules/`, `.next/`, or `.nx/` copied from the primary worktree
- [x] 3.3 Confirm the `[post-start].deps` hook installs dependencies successfully and the new worktree is usable

## 4. OpenSpec validation

- [x] 4.1 Run `openspec validate --strict worktrunk-copy-ignored-excludes` and confirm it passes
- [x] 4.2 Run `openspec verify worktrunk-copy-ignored-excludes` before archive
