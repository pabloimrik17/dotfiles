# Proposal

## Why

Repeating gh-dash's `f` or `F` can reuse an AoE session that is trashed or archived, so the helper reports success while the normal AoE panel hides it. [Issue #227](https://github.com/pabloimrik17/dotfiles/issues/227) documents this failure and a local hotfix; the repository needs an explicit restoration contract and regression coverage.

## What Changes

- Restore a selected trashed session through `aoe session restore`, or unarchive an archived session through `aoe session unarchive`, before normal-mode success or review lifecycle handling.
- Preserve the session ID, current title, group and conversation across restoration, including sessions recovered from pending registrations or legacy shortcuts.
- Leave live sessions and list output without a `state` field on the existing reuse path.
- Report restoration failures without success output, review launch or replacement registration, retaining the association for retry.
- Clarify that external association storage forbids direct edits to AoE's database while allowing lifecycle operations through its CLI.
- Extend the existing CLI fixture and integration tests; propose a short clarification in the manual's `f`/`F` rows.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ghd-aoe-sessions`: Restore trashed or archived sessions before reuse, preserve identity and review behavior, and specify failure and compatibility handling.

## Impact

- Implementation: `dot_local/lib/ghd-aoe.ts`.
- Tests: `tests/fixtures/ghd-aoe-cli.ts` and `tests/ghd-aoe.test.ts`.
- Documentation: proposed wording for `docs/manual.html`, Worktrees section, gh-dash `f`/`F` rows.
- No new dependency, package upgrade, association-format migration or keybinding change. The repo pins AoE 1.14.0; the issue's evidence uses 1.16.0, so missing lifecycle metadata must remain compatible.
- Existing ambiguous recovery remains an error; prioritizing live candidates and investigating the unverified momentary-appearance symptom are separate work.
- Deployment must preserve the manual hotfix reported in `~/.local/lib/ghd-aoe.ts` until the repository fix is available; applying dotfiles is a later rollout step.
