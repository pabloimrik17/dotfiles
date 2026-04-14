## Context

The global worktrunk user config (`dot_config/worktrunk/config.toml`) currently defines a `[post-start]` hook that detects the project's package manager and runs dependency installation. However, it lacks a `[pre-start]` hook to run `wt step copy-ignored`, which copies gitignored files (`.env.local`, `.python-version`, lockfiles, etc.) from the primary worktree to new worktrees.

Without this hook, users must manually copy these files after every worktree creation, and lockfiles may not be present when `post-start.deps` runs.

## Goals / Non-Goals

**Goals:**

- Add `wt step copy-ignored` as a pre-start hook in the global worktrunk config
- Ensure it runs before dependency installation so lockfiles are available

**Non-Goals:**

- Changing the `.worktreeinclude` whitelist (that's per-project)
- Modifying the existing `post-start.deps` hook behavior
- Adding per-project worktrunk config changes

## Decisions

**Decision: Use `[pre-start]` section, not `[post-start]`**

The `copy-ignored` step MUST run before dependency installation. Worktrunk processes `[pre-start]` hooks before `[post-start]` hooks, so placing `copy-ignored` in `[pre-start]` guarantees lockfiles and config files are copied before `bun install` / `pnpm install` / `npm install` runs.

Alternative considered: Adding it as a second entry in `[post-start]` with ordering. Rejected because TOML key ordering within a section is not guaranteed to determine execution order in all implementations, and semantically this is a pre-start concern.

**Decision: Single-line hook command**

Use `copy = "wt step copy-ignored"` as the hook value rather than an inline multi-line script. The `wt step copy-ignored` command already handles all the logic (reading `.worktreeinclude`, filtering gitignored files, skipping existing files). No wrapper script is needed.

## Risks / Trade-offs

**[Risk] `wt` CLI not installed** → The `wt step copy-ignored` command will fail if `wt` is not on `$PATH`. This is acceptable because worktrunk itself depends on `wt` being available, and the error message from a missing command is clear. No additional guard is needed.

**[Risk] No `.worktreeinclude` in project** → `wt step copy-ignored` handles this gracefully (no files to copy, exits cleanly). No mitigation needed.
