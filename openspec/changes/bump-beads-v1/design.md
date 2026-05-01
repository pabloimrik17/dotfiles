## Context

Beads is the Dolt-powered issue tracker the user relies on across multiple machines via `bd dolt push/pull`. The 0.62 → 1.0 jump migrates the underlying Dolt schema to v11 (one-way), moves the upstream repo from `steveyegge/beads` to `gastownhall/beads`, and disables auto-push by default. The `bd batch`, `bd config apply`, and `bd ready --exclude-label` features that warrant adoption only land in 1.0+, but those benefits are downstream of safely landing the migration first.

Multiple machines compound the migration risk: every `.beads/` database on every machine migrates independently on the first `bd` invocation post-upgrade. There is no coordinated rollout — the user upgrades each machine on its own schedule, and Dolt push/pull between a v11-schema machine and a pre-v11 machine is the failure mode to avoid.

## Goals / Non-Goals

**Goals:**

- Upgrade `beads` to 1.0.3 across every machine with zero data loss.
- Establish the `bd dolt pull` → `bd config apply` routine as a documented cross-machine sync habit.
- Confirm that the `beads@beads-marketplace` Claude plugin and the existing `claude-hooks` spec (SessionStart/PreCompact `bd prime`) continue to function unchanged.
- Decide and record the auto-push policy (default-off in 1.0.3 vs. re-enabled).
- Verify no scripts or templates invoke the now-rejected `bd config set issue-prefix`.

**Non-Goals:**

- Adopting `bd story`, `bd milestone`, or `bd config drift` as routine commands.
- Pinning `beads` to a specific brew version in the install script.
- Coordinating multi-machine schema migration beyond the documented per-machine sequence.
- README.md / docs/manual.html updates.

## Decisions

### Decision: Jump directly to 1.0.3 — skip 1.0.0 and 1.0.1

Versions 1.0.0 and 1.0.1 shipped with a missing `started_at` column and an incomplete claude-plugin hook deduplication path. v1.0.3 carries an automatic repair for the missing column on installs upgrading from 0.62/0.63 directly, plus the `fix(setup): skip duplicate hooks when beads plugin is installed` patch. Brew will install whatever is current on each machine's `brew update` cycle; if 1.0.3 is current, the migration runs once cleanly.

**Alternatives considered:**

- Pin to 1.0.0 once, then jump again to 1.0.3. Rejected: schema migration is one-way; running it twice on the same `.beads/` (once into v11 with bad column, once with repair) is strictly worse than running it once via 1.0.3.
- Wait for 1.0.4+. Rejected: indefinite delay; 1.0.3 is the published-stable baseline as of proposal time.

### Decision: Backup `.beads/` per-machine before first `bd` invocation post-upgrade

Schema v11 migration is one-way. The only safe rollback path is restoring the pre-migration `.beads/` directory from a copy. Per-machine backup (e.g., `cp -a .beads .beads.pre-v11.bak`) before the first `bd` invocation creates that path.

**Alternatives considered:**

- Trust the migration and skip backup. Rejected: irreversible operation without any rollback affordance.
- Centralized backup via `bd dolt push` to a remote before migration. Rejected: pushing pre-migration state to a remote that another machine then pulls post-migration creates a schema-mismatch situation worse than no backup.

### Decision: Adopt `bd dolt pull && bd config apply` as the cross-machine sync routine

`bd config apply` is idempotent and remediates drift in hooks, Dolt remote URL, and shared-server state — three domains that _can_ fall out of sync between machines and that `bd dolt pull` does not touch. Making `apply` part of the post-pull habit closes that loophole at the cost of one additional command per machine-switch.

**Alternatives considered:**

- Run `bd config drift --check` first and only apply if non-zero. Rejected: `apply` is idempotent and dry-run-safe; the extra `drift` step is informational overhead with no operational gain on the typical case.
- Wire `bd config drift --check` into a Claude Code SessionStart hook. Considered for follow-up; out-of-scope here because this proposal is the upgrade, not a hook expansion.

### Decision: Keep auto-push disabled by default after upgrade

`bd dolt push` auto-push being default-off in 1.0.3 is upstream's deliberate choice for predictability. The user previously had auto-push enabled in 0.62 by virtue of being the default, but explicit-push aligns better with the user's existing dolt mental model (push is a discrete intent, not a side effect).

**Alternatives considered:**

- Re-enable auto-push to preserve 0.62 behavior. Rejected: the user has not flagged a workflow that depends on it; the new default is the safer choice.

### Decision: No spec changes to `claude-hooks` — `bd prime` is still the canonical command name

The `claude-hooks` spec already references `bd prime` (the result of the earlier `bd onboard` → `bd prime` rename). 1.0 does not rename it again. The spec's existing scenarios continue to hold post-upgrade.

**Alternatives considered:**

- Add a new requirement to `claude-hooks` documenting the v1.0.3 hook-deduplication behavior. Rejected: the deduplication is upstream defensive behavior, not a contract with this dotfiles repo; adding a scenario for it would couple the spec to upstream implementation details.

## Risks / Trade-offs

- **Risk: Cross-machine schema mismatch during partial rollout** — if machine A is upgraded to v11 and `bd dolt push`es, machine B (still on 0.62) cannot `bd dolt pull` without breaking → Mitigation: upgrade machines on the same operational window; if not possible, halt `bd dolt` operations until all machines are at 1.0.3.
- **Risk: Schema v11 migration corrupts a `.beads/` database** → Mitigation: per-machine `cp -a .beads .beads.pre-v11.bak` before first `bd` invocation post-upgrade; rollback is `rm -rf .beads && mv .beads.pre-v11.bak .beads` plus `brew install beads@0.62` or extracting from a prior brew tap commit.
- **Risk: `beads@beads-marketplace` Claude plugin re-installs hooks redundantly on first run after upgrade** → Mitigation: 1.0.3 already includes the dedup fix; verify by inspecting `.beads/hooks/` for duplicates after first `bd init` post-upgrade.
- **Risk: `bd config set issue-prefix` invocation hidden in a script breaks** → Mitigation: explicit grep-audit step in tasks; replacement command `bd rename-prefix` documented in design and tasks.
- **Risk: `bd config apply` becomes a forgotten step and silently allows drift** → Mitigation: document the routine in `beads-multi-machine-sync` spec; user habit reinforcement only — no automated enforcement (a SessionStart hook for `bd config drift --check` is out of scope).

## Migration Plan

1. **Pre-flight (every machine)**: `cp -a .beads .beads.pre-v11.bak` in every directory containing a `.beads/` (use `fd -t d -H .beads` or similar to enumerate).
2. **Upgrade machine A**: `brew update && brew upgrade beads`. Verify with `bd --version` returns `1.0.3`.
3. **First invocation on machine A**: `bd ready` (or `bd list`) — schema v11 migration runs automatically; verify no errors.
4. **Verify `claude-hooks` still works on machine A**: open Claude Code in a beads-enabled directory, confirm SessionStart `bd prime` runs without error.
5. **Verify plugin hook dedup on machine A**: inspect `.beads/hooks/` for duplicate husky entries (1.0.3 dedup patch should prevent these).
6. **Audit grep**: `rg "bd config set issue-prefix"` across the dotfiles repo — replace with `bd rename-prefix` if found.
7. **Confirm auto-push policy**: keep default-off (decision above) — no config change required, but document the explicit-push expectation in commit message.
8. **Commit and push beads data from machine A**: `bd dolt push` (manual, since auto-push is off).
9. **Repeat steps 2–6 on every other machine** _(do not pull from A on a still-v0.62 machine)_.
10. **Once every machine is at 1.0.3**: pull from A on each, then run `bd config apply` to remediate any drift in hooks/remote/server.
11. **Add `bd config apply` to the routine**: from now on, every machine-switch starts with `bd dolt pull && bd config apply` (record this as a habit, no automation).

**Rollback per machine**: `brew uninstall beads && brew install beads@0.62` (or extract from prior tap commit) → `rm -rf .beads && mv .beads.pre-v11.bak .beads`. Cross-machine: stop pushing/pulling between machines until all are on the same version.

## Open Questions

- **Auto-push re-enable**: confirmed default-off (Decision above). Open for future review if the user discovers a workflow that depended on it.
- **Multi-machine schema migration coordination**: how strictly does the user want to enforce "all machines on 1.0.3 before any cross-machine `bd dolt`"? The migration plan documents the safe sequence, but the user's actual schedule may necessitate a quiet period — recorded as a known operational constraint, not a hard gate.
