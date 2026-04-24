## Why

`wt step copy-ignored` (run from `[pre-start].copy`) currently copies every gitignored file from the primary worktree into each new worktree. For typical JS/TS/Python projects this drags 10+ GB of `node_modules/`, framework build caches, Python venvs and bundler caches that are either immediately reinstalled by the `[post-start].deps` hook, regenerate on first build, or break because they embed absolute paths. The excludes already exist in one machine's live `~/.config/worktrunk/config.toml`, but until they land in the chezmoi source, `chezmoi apply` reverts them on every run and other machines never get them.

## What Changes

- Add a `[step.copy-ignored]` section to `dot_config/worktrunk/config.toml` with a curated `exclude` list of regenerable directories (Node package dirs, framework build outputs, bundler/transpiler caches, generic build outputs, test/coverage artifacts, Python tool caches and venvs).
- Intentionally retain copying of `.idea/` (JetBrains project state) and `ios/Pods/` (slow CocoaPods reinstall) — they are NOT added to the exclude list.
- No changes to the existing `[pre-start].copy`, `[post-start].deps`, `[commit.generation]`, or `[projects]` sections.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `worktrunk-config`: Adds a new requirement that the user config defines a `[step.copy-ignored]` exclude list covering regenerable directories, complementing the existing `[pre-start].copy` requirement.

## Impact

- **Source file**: `dot_config/worktrunk/config.toml` (chezmoi source).
- **Target file**: `~/.config/worktrunk/config.toml` on every machine after `chezmoi apply`.
- **Runtime behavior**: `wt switch --create <branch>` in a Node project no longer copies `node_modules/`, `.next/`, `.nx/`, etc. The `[post-start].deps` hook still reinstalls dependencies, so the end state of a new worktree is unchanged; only copy time, disk usage, and correctness (absolute-path caches) improve.
- **No impact** on: worktrunk binary, chezmoi templates, other dotfiles, or CI.
