## Why

The global worktrunk config (`dot_config/worktrunk/config.toml`) is missing `wt step copy-ignored` in pre-start hooks. Without it, gitignored files (`.env.local`, `.python-version`, `.claude/settings.local.json`, etc.) are not automatically copied from the primary worktree to new worktrees, requiring manual copying every time a worktree is created. This also means lockfiles aren't available before `post-start.deps` runs dependency installation.

## What Changes

- Add a `[pre-start]` section to the global worktrunk config with `copy = "wt step copy-ignored"`
- This hook runs before the existing `[post-start].deps` hook, ensuring copied lockfiles and config files are available when dependency installation starts

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `worktrunk-config`: Add a `pre-start` hook requirement for running `wt step copy-ignored` before dependency installation

## Impact

- **File**: `dot_config/worktrunk/config.toml` — new `[pre-start]` section added
- **Behavior**: All new worktrees created via worktrunk will automatically get gitignored files copied from the primary worktree before deps are installed
- **Dependencies**: Relies on `wt step copy-ignored` being available (provided by the `wt` CLI)
