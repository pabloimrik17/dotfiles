## Context

Worktrunk's `wt step copy-ignored` reads `.worktreeinclude` + `.gitignore` from the primary worktree and copies matching paths into a newly created worktree. The user's chezmoi-managed config at `dot_config/worktrunk/config.toml` registers this as a `[pre-start].copy` hook so it runs before `[post-start].deps` reinstalls packages.

The current source file has no `[step.copy-ignored]` block, so worktrunk uses its default behavior: copy everything that is ignored. In practice this duplicates `node_modules/`, framework build caches, Python venvs, and bundler caches into each new worktree — wasted I/O, wasted disk, and sometimes outright broken state because venvs and some caches bake in the absolute path of the source worktree.

The fix has already been validated on one machine by editing `~/.config/worktrunk/config.toml` directly. That file is chezmoi-managed, so on the next `chezmoi apply` it is reverted. This change is specifically about porting the validated block back into the chezmoi source so every machine picks it up.

## Goals / Non-Goals

**Goals:**

- Stop copying directories that are reinstalled or regenerated anyway.
- Stop copying directories that are broken after the copy (absolute paths baked in).
- Keep copying directories that are expensive to regenerate (`ios/Pods/`) or useful to inherit (`.idea/`).
- Use worktrunk's documented pattern style (trailing `/` for directory entries).
- Keep the chezmoi source file and the live user config in sync so `chezmoi apply` is a no-op after the change lands.

**Non-Goals:**

- Changing `wt step copy-ignored`'s internal matching logic. This is a pure user-config edit.
- Adding file-level excludes (`.eslintcache`, `.DS_Store`, `.tsbuildinfo`) — not part of the documented exclude syntax; would silently not match.
- Making the exclude list project-aware (per-repo excludes). The `[projects]` table can already override per project if ever needed.
- Documenting or changing the `[post-start].deps` hook; this change assumes it keeps doing its job.

## Decisions

### Decision: Exclude list lives in `[step.copy-ignored]`, not in `.worktreeinclude`

Worktrunk exposes two mechanisms for controlling what `copy-ignored` moves: a repo-local `.worktreeinclude` file and a user-global `[step.copy-ignored].exclude` list. The excludes here apply to _every_ project the user opens worktrees in, so the user-global config is the right place. A `.worktreeinclude` would need to be added to every repo and would pollute unrelated projects.

### Decision: Directory patterns only (trailing `/`)

All entries end in `/`. This matches worktrunk's documented exclude syntax for directories and avoids the silent-non-match trap of file globs that the tool does not evaluate. Known file-level offenders (`.eslintcache`, `.DS_Store`, `.tsbuildinfo`) are intentionally left out rather than added in an unsupported form.

### Decision: Keep `.idea/` and `ios/Pods/`

- `.idea/` carries JetBrains run configurations, bookmarks, and per-project editor state that are genuinely useful to inherit into a new worktree; they are cheap to copy and not regenerated on install.
- `ios/Pods/` is reinstalled by CocoaPods, but CocoaPods install takes 5–10 minutes on a cold tree versus seconds for npm-family reinstalls. Copying pays off.

### Decision: Port the already-validated block verbatim

The exclude list has been running on the author's machine and has already proven out against real JS/TS/Python workflows. The chezmoi source change is literally "write the same block into the source of truth." No list re-derivation, no shrinking for minimalism — doing so risks losing a hard-won entry.

### Decision: No template variables in the TOML block

The block contains no host-specific or user-specific values. It is checked in as plain TOML, not a chezmoi `.tmpl`. The surrounding file stays `config.toml`, consistent with how it is already managed.

## Risks / Trade-offs

- **Risk:** Worktrunk changes its exclude-pattern syntax (e.g., accepts file globs in the future) and this list becomes stale. → **Mitigation:** The `worktrunk` skill in this dotfiles repo is the canonical reference; revisit the block when bumping worktrunk. Scenarios in the spec will fail if the tool silently stops honoring the list.
- **Risk:** A project stores something non-regenerable under an excluded path (e.g., a `node_modules/` with hand-patched vendor code). → **Mitigation:** Documented precedent is that such projects commit a `.worktreeinclude` override or commit the patch; no reasonable exclude list can accommodate invisible per-project conventions.
- **Risk:** User already has a local edit to `~/.config/worktrunk/config.toml` and `chezmoi apply` now conflicts. → **Mitigation:** This is the expected outcome on the already-edited machine — `chezmoi apply` will be a no-op after the source matches. On other machines there is nothing to conflict with.
- **Trade-off:** First-time dependency install in a new worktree is now mandatory (no cached `node_modules/` to short-circuit on). This is desirable: the `post-start.deps` hook already assumed it would run, and relying on a copied `node_modules/` was fragile.

## Migration Plan

1. Edit `dot_config/worktrunk/config.toml` to add the `[step.copy-ignored]` block.
2. Run `chezmoi diff` to confirm the only change is the new block and nothing else in `~/.config/worktrunk/config.toml` drifts.
3. Run `chezmoi apply`. On the already-patched machine this is a no-op; on other machines it writes the new block.
4. Verify with `wt config show` that `[step.copy-ignored].exclude` lists the entries.
5. Verify on a Node project that `wt switch --create <branch>` no longer copies `node_modules/` / `.next/` / `.nx/`, and that `[post-start].deps` still installs deps successfully.

**Rollback:** Remove the `[step.copy-ignored]` block from `dot_config/worktrunk/config.toml` and re-run `chezmoi apply`. Behavior returns to "copy everything ignored."
