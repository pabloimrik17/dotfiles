# Proposal

## Why

The Worktrunk dependency hook inherits ambient Node and reports completion even when installation fails, leaving new worktrees without dependencies in projects with strict Node requirements. [Issue #230](https://github.com/pabloimrik17/dotfiles/issues/230) reports this with eci-av; the current hook confirms both causes.

## What Changes

- Select an already installed nvm Node matching the worktree root's `.nvmrc` before invoking the package manager, supporting numeric exact, major, and minor pins with an optional `v` prefix and surrounding whitespace.
- Warn and retain ambient Node when a nonempty pin cannot be resolved locally; do not download Node or source nvm during the hook.
- Propagate installation failures and emit `[install-deps] done` only after a successful installation. Log skipped installations distinctly and keep their exit status at zero.
- Preserve lockfile precedence (Bun, pnpm, npm) and background execution.
- Add isolated regression coverage for Node selection, package-manager dispatch, and success/failure/skip outcomes.
- Clarify the existing conflicting no-lockfile scenarios in favor of the already implemented diagnostic markers, correct the stale hook name in the copy-ignored comment, and propose updated Worktrees manual wording.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `worktrunk-config`: Project Node selection for dependency installation, explicit failure propagation, and unambiguous outcome markers.

## Impact

- Implementation target: `dot_config/worktrunk/config.toml`, limited to `install-deps` and the adjacent stale comment.
- Tests: new `tests/worktrunk-install-deps.test.ts`, using the existing Bun subprocess-test approach; existing CI already runs `bun test`.
- Documentation: proposed revision to the post-start row in section 5 of `docs/manual.html`.
- No new tools, packages, shell initialization changes, or changes to the Claude Node launcher are needed. Projects using pnpm/npm retain their own package managers; this repository's development commands use Bun.
- Background completion is still asynchronous: a successful `wt switch` does not itself establish that dependencies are ready.
