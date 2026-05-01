## 1. Pre-upgrade audit

- [ ] 1.1 Run `rg "bd config set issue-prefix"` across the dotfiles repo and confirm zero matches; if any exist, replace with `bd rename-prefix` invocations
- [ ] 1.2 Run `rg "bd onboard"` across the dotfiles repo and confirm zero matches (legacy command renamed to `bd prime` previously, but verify)
- [ ] 1.3 List all directories containing `.beads/` on machine A: `fd -t d -H -I '^\.beads$' ~ 2>/dev/null` (or equivalent)
- [ ] 1.4 Verify the `beads@beads-marketplace` Claude plugin is currently installed: `claude plugin list 2>&1 | grep beads`

## 2. Per-machine backup (run on every machine before first post-upgrade `bd` invocation)

- [ ] 2.1 For each `.beads/` directory found in 1.3: `cp -a .beads .beads.pre-v11.bak`
- [ ] 2.2 Verify each backup exists and is non-empty
- [ ] 2.3 Note the current beads version: `bd --version` (expected `0.62.0` pre-upgrade)

## 3. Upgrade machine A (primary)

- [ ] 3.1 `brew update && brew upgrade beads`
- [ ] 3.2 Verify `bd --version` returns `1.0.3` or higher
- [ ] 3.3 Run first post-upgrade `bd` command (e.g., `bd ready`) in any beads-enabled directory; observe schema v11 migration runs without error
- [ ] 3.4 Verify schema migration completed: `bd list --status open` returns the same set of issues that existed pre-upgrade
- [ ] 3.5 Inspect `.beads/hooks/` for duplicate husky entries; confirm 1.0.3 dedup fix prevents redundant hook installation

## 4. Verify Claude Code integration on machine A

- [ ] 4.1 Open a Claude Code session in a beads-enabled directory; confirm `bd prime` SessionStart hook runs without error
- [ ] 4.2 Trigger a context compaction in Claude Code; confirm `bd prime` PreCompact hook runs without error
- [ ] 4.3 Confirm the `beads@beads-marketplace` plugin commands (e.g., `/beads:ready`, `/beads:create`) still work post-upgrade
- [ ] 4.4 Test `bd batch` from a Claude Code session: create one parent issue and two child issues with a dependency in a single `bd batch` invocation; verify all three appear and are linked

## 5. Push from machine A and confirm explicit-push policy

- [ ] 5.1 Make a small beads change on machine A (e.g., add a label to an issue)
- [ ] 5.2 Run `bd dolt status` and confirm the change is local-only (auto-push disabled)
- [ ] 5.3 Run `bd dolt push` explicitly to propagate
- [ ] 5.4 Confirm no `auto_push` or equivalent setting was retained from 0.62 (config defaults to off)

## 6. Upgrade every other machine

- [ ] 6.1 On each remaining machine: complete steps 2.1–2.3 (backup) before any `bd` invocation post-upgrade
- [ ] 6.2 On each remaining machine: complete steps 3.1–3.5 (upgrade and verify schema migration)
- [ ] 6.3 On each remaining machine: complete steps 4.1–4.3 (verify Claude Code integration)
- [ ] 6.4 Do not attempt `bd dolt pull` from machine A on any machine still at 0.62 — wait until that machine is also at 1.0.3

## 7. Establish the multi-machine sync routine

- [ ] 7.1 On each secondary machine (after its own upgrade is complete): `bd dolt pull` from machine A's pushed state
- [ ] 7.2 Run `bd config apply --dry-run` and inspect the proposed changes
- [ ] 7.3 Run `bd config apply` to remediate hooks/remote/server drift
- [ ] 7.4 Verify drift is cleared: `bd config drift` reports all `ok`/`info`/`skipped`, no `drift` items
- [ ] 7.5 Document the routine in personal notes / TERMINAL.md (added in `bump-brew-deps`): "after every `bd dolt pull`, run `bd config apply`"

## 8. Adopt 1.0 features as habits

- [ ] 8.1 Label one in-progress beads issue with `wip` and verify `bd ready --exclude-label wip` filters it out
- [ ] 8.2 Create one issue using bd type `spike` (e.g., `bd create --type spike "Explore X"`) and confirm it is recognized as a first-class type
- [ ] 8.3 Use `bd batch` for the next bulk-create operation from Claude Code (e.g., creating an epic with children and dependencies in one transaction)

## 9. Final validation and commit

- [ ] 9.1 Run `brew outdated | grep beads` and confirm no output (beads no longer outdated)
- [ ] 9.2 Run `openspec validate bump-beads-v1 --strict` and resolve any failures
- [ ] 9.3 Once all machines are confirmed at 1.0.3 and `bd config apply` routine is established: remove the per-machine `.beads.pre-v11.bak` backups (only after a soak period of at least one week of normal use)
- [ ] 9.4 Commit the spec change (the new `beads-multi-machine-sync` capability) per Conventional Commits
