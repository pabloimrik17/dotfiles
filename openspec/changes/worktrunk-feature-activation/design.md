## Context

The worktrunk user config (`dot_config/worktrunk/config.toml` → `~/.config/worktrunk/config.toml`) currently activates two features (copy-ignored on pre-start, package-manager-aware deps install on post-start) plus the `[commit.generation]` Claude haiku setup with full Conventional-Commits templates. Several worktrunk features that pair naturally with this stack remain unset (`[list].summary`, `[switch.picker].pager`), and the user has no shortcuts for the daily commands that operate on hooks, branches, and merges. The exclude list is good but missed `.stryker-tmp/`, which appears in the adjacent monolab repo via Stryker mutation tests and can grow into the GB range.

This change is intentionally scoped to "activation" — wiring up features whose dependencies (delta, Claude haiku, jq) are already installed by other specs (`delta-catppuccin`, the existing `[commit.generation]`). Anything that requires structural redesign of hooks (named-array split, sync-claude lift to global, agent status markers) is reserved for the sibling change `worktrunk-claude-integration`.

## Goals / Non-Goals

**Goals:**

- Activate worktrunk features whose dependencies are already present in the dotfiles install (delta, Claude haiku).
- Make the `[post-start].install-deps` hook log greppable by adding phase markers, without changing its non-blocking semantics.
- Provide three wt aliases (`wtlog`, `wtci`, `mc`) and one shell alias (`wsc`) that codify the user's most-repeated worktrunk commands.
- Cover `.stryker-tmp/` in the global exclude list so mutation-test artifacts never copy across worktrees.

**Non-Goals:**

- Splitting the install-deps hook into per-package-manager named hooks (`[[post-start]]` arrays). The discussion converged on a single hook with phased echoes; a future change can revisit.
- Lifting the `[pre-remove].sync-claude` from project config to global. That belongs to `worktrunk-claude-integration` because it requires global save-base hardening and may extend to `.codex/` and `.opencode/`.
- Wiring agent status markers (`🤖`/`💬`) — also in the sibling change.
- Changing `.worktreeinclude` in any repo. Default copy-ignored behavior is correct for monolab; the dotfiles `.worktreeinclude` cleanup is an orthogonal task.
- Project-level `wt.toml` for monolab.

## Decisions

### Decision: keep `[post-start]` (single table) over `[[post-start]]` (array of tables)

**Rationale.** With one named hook (`install-deps`), `[post-start]` and `[[post-start]]` are semantically equivalent in worktrunk: both produce one log file (`user:post-start:install-deps`) and one process. The visibility benefit of named arrays comes from MULTIPLE entries — when a future change introduces a second post-start hook, migrating to `[[post-start]]` is a one-line conversion. Until then, the single-table form is shorter and avoids the implication that more hooks are coming.

**Alternatives considered.**

- _Three named hooks, one per package manager (bun/pnpm/npm)._ Gives per-PM logs but two hooks no-op on every worktree; adds three TOML entries for a single concern; complicates `wt config show`. Rejected.
- _Pre-start blocking install (Prowler-style)._ Better debug visibility on failure but blocks worktree start by 30–120 s, which is hostile to the Claude-driven flow where `wsc <branch>` should hand control to the agent immediately. Rejected.

### Decision: phase markers via `echo`, not separate hooks

**Rationale.** The user wanted Prowler-style per-phase logging without splitting the hook. A single hook can emit `[install-deps] detecting…`, `[install-deps] detected pnpm → installing`, `[install-deps] done` to its own log file. `wt config state logs get --hook=user:post-start:install-deps` returns one path, and `grep '\[install-deps\]'` on that file reveals phase progression. No structural change required.

### Decision: `mc` alias toggles `WORKTRUNK_COMMIT__GENERATION__COMMAND` per-invocation

**Rationale.** The worktrunk tips page recommends env-var override for one-shot LLM bypass: `WORKTRUNK_COMMIT__GENERATION__COMMAND='…' wt merge`. The override is local to the command invocation, so the global Claude-haiku setup remains the default. The override command `f=$(mktemp); printf '\n\n' > "$f"; sed 's/^/# /' >> "$f"; ${EDITOR:-vi} "$f" < /dev/tty > /dev/tty; grep -v '^#' "$f"` (from worktrunk tips #7) opens `$EDITOR` with diff context commented out for reference, then strips the comments before returning the message.

**Alternatives considered.**

- _Edit `[commit.generation]` permanently to use `$EDITOR`._ Loses the daily benefit of LLM-generated messages. Rejected.
- _Two separate aliases (`mc-llm`, `mc-edit`)._ Unnecessary — the LLM is already the default on plain `wt merge`. The alias only needs to provide the alternative path.

### Decision: `wtlog` is a wt alias, `wsc` is a shell alias

**Rationale.** `wtlog` operates on worktrunk state and reads cleanest as `wt wtlog <hook-id>`. It belongs in `[aliases]` of the worktrunk config so it travels with the rest of the worktrunk surface. `wsc` is a wrapper that invokes `wt switch --create -x claude`; it ends in `claude`, not `wt`, and is the entry point of an interactive flow. It belongs in `dot_zshrc.tmpl` next to other zsh shortcuts so users can type `wsc` directly without the `wt` prefix.

### Decision: extend the exclude list incrementally, not exhaustively

**Rationale.** The existing exclude list is curated against directories observed in real repos. Adding `.stryker-tmp/` is justified because it appears in monolab. Adding speculative entries (`.serverless/`, `.docusaurus/`, `.astro/`) for hypothetical projects pollutes the list with future maintenance burden. The pattern: every time a new ephemeral dir surfaces, the spec evolves.

## Risks / Trade-offs

- **Risk**: enabling `[list].summary = true` calls Claude haiku once per branch on every `wt list`/`wt switch`. → **Mitigation**: worktrunk caches summaries per commit (per docs); the existing `[commit.generation]` already targets `claude --model=haiku --tools='' --disable-slash-commands --setting-sources='' --system-prompt=''`, which is the cheapest possible invocation. Cost is bounded.
- **Risk**: phased echoes change the log content of `install-deps`, so any external tooling that grepped the previous (anonymous) output will need a one-line update. → **Mitigation**: there is no external consumer documented in this repo; the only reader is the user via `wt config state logs`.
- **Risk**: renaming `[post-start].deps` → `install-deps` breaks any user who has wired tooling against the old name. → **Mitigation**: this is the user's own dotfiles; no external consumers. The change ships as a single chezmoi apply.
- **Trade-off**: the `mc` override command embeds a multi-line bash snippet inside a TOML string. → Accepted because the alternative (a separate `dot_local/share/worktrunk/mc-edit.sh`) introduces an indirection for ~3 lines of shell. If the snippet grows, extract later.
- **Risk**: `wsc` collides with another binary or alias on the user's path. → **Mitigation**: zsh aliases shadow binaries when defined first; verify no conflict at apply time. If conflict surfaces, rename to `wsc!` or similar.

## Migration Plan

1. Edit `dot_config/worktrunk/config.toml`: add `[list]`, `[switch.picker]`, extend `[step.copy-ignored].exclude`, rename `deps` → `install-deps` and add echoes, add `[aliases]` table.
2. Edit `dot_zshrc.tmpl`: add the `wsc` alias next to existing worktrunk-related aliases (or create a small "worktrunk shortcuts" block).
3. Run `chezmoi apply` to propagate.
4. Run `wt config show` to verify the resulting `~/.config/worktrunk/config.toml`.
5. Smoke-test: open a fresh shell, type `wsc test-branch`; confirm worktree creation, deps install in background with phased markers in `wt config state logs get --hook=user:post-start:install-deps`, and Claude launches. Then `wt remove test-branch`.

**Rollback**: revert the chezmoi source files and re-run `chezmoi apply`. No state migration required — the renamed hook key is purely textual and worktrunk reads the active TOML on each invocation.

## Open Questions

- Is there any ergonomics difference between defining `[aliases]` at top level vs nested? Worktrunk docs show top-level `[aliases]`, which is what this design assumes. Verify at implementation time by running `wt <alias-name>` and observing resolution.
- Should `mc` also accept arguments forwarded to `wt merge` (e.g., target branch)? The worktrunk alias template engine should permit this via `{{ args }}`; confirm in implementation, otherwise document the limitation.
