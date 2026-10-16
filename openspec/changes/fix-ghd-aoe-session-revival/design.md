# Design

## Context

See [proposal.md](proposal.md) for motivation and [the spec delta](specs/ghd-aoe-sessions/spec.md) for the behavior contract.

`listSessions` runs profile-scoped `aoe list --json`. `recoverAssociation` selects by saved ID and canonical worktree, or by an unambiguous pending/legacy match. `runIntegration` then resolves the session with `sessionForAssociation` and either returns `queued` or calls `manageReview`. These operations already run under a lock scoped to the PR identity. The current `AoESession` interface has no lifecycle state and the integration never restores sessions.

The integration tests run the real helper against isolated `aoe`, `wt`, `gh` and `claude` CLI fixtures. The fixture records command arguments and maintains sessions, runtime processes and conversation IDs, but currently has no trash/archive model. This provides a regression seam without touching real sessions or invoking a model.

The repository pins AoE 1.14.0 and local read-only help confirms `session restore` and `session unarchive` exist. The issue's observations concern 1.16.0. Its [list implementation](https://github.com/njbrake/agent-of-empires/blob/v1.16.0/src/cli/list.rs) confirms all-state listing, the three state tags, and that a trashed session can retain its archive marker. Local restore help likewise says restoration returns a session to its prior bucket. Therefore the issue's proposed unconditional in-memory `state = "live"` after restore is insufficient for an archived-then-trashed session.

## Goals / Non-Goals

**Goals:**

- Centralize lifecycle recovery after identity validation and before modality handling.
- Keep all lifecycle mutations profile-scoped, bounded and mediated by AoE's CLI.
- Preserve the existing external record format, review conversation handling and locking.

**Non-Goals:**

- Changing recovery candidate ranking, title collision rules, worktree preparation or missing-session replacement.
- Upgrading AoE, inferring lifecycle state when old list output omits it, or changing trash retention.
- Opening/focusing the AoE TUI, automatically launching normal sessions, or diagnosing the issue's unverified momentary-appearance symptom.

## Decisions

### Restore once after session selection

Add optional lifecycle state to `AoESession` and introduce a small asynchronous lifecycle helper. Invoke it immediately after `sessionForAssociation`, still inside the existing lock and before the normal/review branch. Return the refreshed session for final display metadata. This covers saved, pending and legacy associations without duplicating logic in each recovery path.

Keep `aoe list --json` unchanged. Filtering to live sessions would hide the reusable identity and risk registering a duplicate; creating replacement sessions would lose the conversation. Do not move restoration earlier than identity selection or change the current ambiguity checks.

### Confirm lifecycle transitions instead of assuming restore means live

For an initially trashed session, invoke `aoe --profile <profile> session restore <id>`, then refresh the selected profile's session list and resolve the same ID. If it is now archived, invoke `session unarchive <id>` and refresh again. An initially archived session goes directly through unarchive and refresh. Require the resulting session to report `live`; a missing session, missing state after a lifecycle mutation, or residual non-live state is a failure. Limit an invocation to at most one restore and one unarchive, with no retry loop.

An initially live session or one whose initial list row omits `state` takes the existing path without lifecycle commands or additional list calls. Other unrecognized initial state values also retain prior behavior; only the two known hidden states trigger recovery. Missing-state compatibility preserves existing support but cannot fix hidden sessions on older output that does not expose their state.

Use the existing argv-based runner, `aoeArgs`, environment and `DEFAULT_COMMAND_TIMEOUT_MS` for lifecycle commands and existing listing helpers for refresh. A one-shot mapping is simpler, but refreshing is necessary because restoration can reveal archived state and a successful command alone does not prove the selected session is live.

### Preserve associations on failure

Keep the association write before lifecycle handling, as in the current reuse path. On command failure, throw an operation-specific `commandFailure` such as `Unable to restore AoE session` or `Unable to unarchive AoE session`. Capture command stdout instead of forwarding it. Validation failures after refresh identify the selected session and failed transition. `cliMain` then emits its existing stderr diagnostic, exits 1 and prints no success record.

Do not roll back a successful restore if the subsequent unarchive fails: the session remains archived and a later invocation retries unarchive against the same saved ID. Do not fall through to registration or `manageReview` after any lifecycle failure.

### Use the existing integration harness for regression coverage

Extend both fixture session types with lifecycle data. The CLI fixture should emit `state: live` by default while offering an explicit way to omit it for older-output tests. Model archive-before-trash so restore can return `archived`, implement profile-scoped restore/unarchive, and allow operation-specific failures and success-without-transition injection. A start attempt against a hidden session should fail in the fixture, so ordering bugs are observable.

Cover both modalities and both hidden states; assert ID, title, group and conversation preservation, exact profile/ID targeting, no duplicate registration or repeated naming, and restore/unarchive-before-start ordering. Include combined archive/trash, initially missing state, pending/legacy recovery, failures and successful retries. Existing tests remain the coverage for running reviews, missing conversations, ambiguity, concurrency and keybinding contracts.

### Proposed Manual Updates — MODIFY (Section 5: Worktrees)

Keep the current `f`/`F` rows and all existing content. Append this exact HTML text inside the corresponding description cells:

```html
<!-- f: append after "PR-title fallback." -->
Restores trashed or archived sessions before reuse, preserving their conversation.

<!-- F: append after "PR)." -->
Restores trashed or archived sessions before starting or resuming the review.
```

This is a proposed edit for implementation review. The [update-manual skill](../../../.agents/skills/update-manual/SKILL.md) says “Never edit docs/manual.html without user confirmation”; approval of this documented edit as part of the apply request is sufficient. No manual edit is made during proposal creation. No README/tool inventory change is needed for this behavior fix.

## Risks / Trade-offs

- Older AoE list output lacks lifecycle state → Preserve existing behavior and explicitly test it; automatic restoration requires state-aware output. No package-version change is bundled here.
- Restore may return archived state → Refresh after mutations and unarchive the same ID before claiming success.
- AoE TUI or external tools can mutate state outside the helper's PR lock → Bound operations, fail visibly on command/refresh errors, and allow retry; do not promise atomicity against unrelated clients.
- Refresh adds one or two list calls to hidden-session recovery → Keep live-session reuse unchanged and use existing command timeouts.
- The issue reports a manually installed hotfix → Do not apply the old repository file over it during planning; reconcile through a targeted deployment after the fix is merged.

## Migration Plan

No association migration is needed. After implementation, run the isolated regression suite and repository checks. Merge through the normal repository workflow, then review a targeted chezmoi diff for `.local/lib/ghd-aoe.ts` and deploy that helper from the updated source. Verify the target is synchronized and smoke-test `f`/`F` with disposable sessions covering trash and archive. These rollout actions are later operational work, not part of this proposal run.

If rollback is needed, restore the previous helper through chezmoi without deleting association records or sessions. Rolling back reintroduces the hidden-session defect; manually restoring/unarchiving via AoE remains the workaround.

## Open Questions

- Does the momentary appearance reported in the issue occur with `f`, `F`, or both? The available evidence does not explain it. Track separately if it persists after lifecycle recovery; it does not block this change's testable contract.
