# Tasks

## 1. Session lifecycle recovery and regression coverage

- [x] 1.1 Extend the fixture types in `tests/ghd-aoe.test.ts` and `tests/fixtures/ghd-aoe-cli.ts` with lifecycle state, explicit omitted-state output, archive-before-trash restoration, profile-scoped restore/unarchive, operation-specific failures and success-without-transition behavior. Reject review starts while hidden; verify these behaviors through the integration cases in the following tasks.
- [x] 1.2 Add normal-mode regressions for trashed, archived and archived-then-trashed sessions, plus live and missing-state compatibility. Assert live state before `queued`, stable ID/title/group/conversation, correct profile and ID arguments, no extra registration/inference/launch, and no unnecessary recovery commands for live or missing-state output. Run `bun test tests/ghd-aoe.test.ts` before the production change and confirm hidden-session cases fail for the reported defect.
- [x] 1.3 Add optional state to `AoESession` and the shared lifecycle helper after `sessionForAssociation` in `runIntegration`, using the existing runner, argv helpers, environment and command timeout. Refresh after mutations, restore then unarchive when needed, return refreshed metadata and reject missing or non-live results without retry loops. Verify task 1.2's tests pass.
- [x] 1.4 Add review regressions for trashed and archived sessions, including a session archived before trash. Assert recovery precedes `session start`, preserves the same explicit conversation and does not repeat `/review-team`; verify these tests and the existing running-review and missing-conversation cases pass.
- [x] 1.5 Add recovery regressions for unambiguous pending and legacy sessions in hidden states. Assert no replacement registration and preservation of identity/display metadata; verify existing ambiguity, profile isolation and concurrent invocation tests remain green.
- [x] 1.6 Add failure-and-retry regressions for restore, unarchive and unarchive after successful restore, covering normal and review modes. Also cover successful commands that leave the session hidden and failed refreshes. Assert nonzero exit, useful stderr, empty stdout, no launch or replacement, bounded lifecycle calls and a successful retry against the retained ID; verify with the targeted test file.
- [x] 1.7 Apply the exact `f`/`F` manual additions proposed in `design.md` once that documented edit is approved for implementation. Verify the existing descriptions remain intact and the manual documentation assertions in `tests/ghd-aoe.test.ts` cover the restoration wording.

## 2. Integration validation

- [x] 2.1 Run `bun test tests/ghd-aoe.test.ts` and the CI test command `bun test`; verify lifecycle regressions and the existing suite pass, recording any environment prerequisite blockers explicitly.
- [x] 2.2 Run `bun run lint:oxfmt`, `openspec validate fix-ghd-aoe-session-revival --strict --no-interactive`, and `git diff --check`; verify formatting and proposal validation pass and inspect the diff for changes outside the planned helper, tests, manual and OpenSpec artifacts.

## Workflow follow-up

- Review and merge the implementation through the normal repository workflow; archive the completed OpenSpec change when requested.
- After merge, inspect a targeted chezmoi diff and deploy `.local/lib/ghd-aoe.ts` from the updated source, preserving the reported local hotfix until then. Verify the target is synchronized and `f`/`F` makes disposable trashed/archived sessions live while retaining their IDs and conversations.
- If momentary appearance persists, record whether it occurs with `f`, `F`, or both and investigate it separately.

## Validation record (2026-10-16)

- Before the production fix, `bun test tests/ghd-aoe.test.ts` reproduced all three hidden-session defects: 36 passed, 3 failed because sessions remained hidden after `queued`.
- The completed helper suite passed all 68 tests. Its 68 tests also passed within the repository-wide run with the original 15-second default restored. No permanent change to existing test timeouts was retained.
- `bun test` finished with 170 passed, 1 skipped, and 5 timeouts in the unchanged `tests/claude-swap.test.ts`; timeout cleanup also caused 5 asynchronous fixture-file errors. An isolated retry with the default 5-second timeout timed out in different existing cases and was stopped.
- Diagnostic retry: `bun test tests/claude-swap.test.ts --timeout 30000` passed all 41 tests. All five previously failing cases completed below 5 seconds on that retry. This supported transient machine load rather than an implementation regression; the subsequent standard run below resolved the validation blocker.
- `bun run lint:oxfmt`, `openspec validate fix-ghd-aoe-session-revival --strict --no-interactive`, and `git diff --check` passed. The diff is limited to the helper, fixture, regression tests, approved manual wording and this change's artifacts.
- Final standard retry: `bun test` passed with 175 passed, 1 skipped, 0 failed (176 tests across 10 files, 170.52 seconds), using the original test timeouts. The five previously failing cases completed in 1.1–1.4 seconds. Task 2.1 is complete.
- Pre-commit validation: simplified the fixture listing expression to satisfy the Fallow complexity threshold without changing behavior. `bunx --no-install fallow audit` passed; the subsequent helper suite passed all 68 tests.
