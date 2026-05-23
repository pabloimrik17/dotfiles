## Context

Worktrunk template variables have two scopes. Repo-scoped vars (`primary_worktree_path`, `default_branch`, etc.) are always defined. Operation-scoped vars (`base_worktree_path`, `base`, `target_worktree_path`) are only populated when the operation has that concept — `base_*` requires `--create`. `pre-start` fires for any worktree materialization, including `wt switch <existing>` where no branch is being created and `base_*` is undefined. An undefined variable in a template aborts the hook.

`.claude/.worktree-base` is read only by `[pre-remove].sync-claude` as the destination for Claude approval writeback.

## Goals / Non-Goals

**Goals:**

- Hook succeeds on every worktrunk operation that fires `pre-start`.
- Stack semantics preserved: `--create B --base A` writes A's path.
- No data migration for existing `.worktree-base` files.

**Non-Goals:**

- Renaming `.worktree-base` on disk.
- Fixing the unrelated `post-create`/project-config wording drift in `worktree-file-sync` (separate cleanup).
- Upgrading worktrunk (currently 0.46.1, latest 0.53.0 — no release fixes this; upgrade is a separate decision).

## Decisions

**Use Jinja2 `default()` filter, not pure-primary swap.** Worktrunk's template engine supports `{{ var | default(other_var) }}`; verified against 0.46.1. Pure-primary loses the propagate-up-the-stack behavior the user relies on for LIFO worktree teardown.

**Pass `primary_worktree_path` as the variable, not as a literal string.** `default(primary_worktree_path)` resolves to the runtime value; `default('primary_worktree_path')` would write the literal string. Verified by probe.

**Keep filename `.worktree-base`.** Renaming would require coordinated `sync-claude` edits with no behavior gain.

## Risks / Trade-offs

- Filter syntax must remain supported across worktrunk versions. Docs explicitly document `default` as the recommended pattern for optional variables, so deprecation risk is low.
- Comment in toml carries the rationale so a future reader doesn't simplify back to bare `base_worktree_path` and reintroduce the bug.
