## Why

The trial P1·60 failed its primary criterion. In the week ending 2026-11-11, `work` was at 100 % for about 20 h, and the work Mac caused it alone: the personal Mac never used `work` that week. The work Mac spends a median of 16 points of a Max 5x week per working day, and that is with the user throttling it to last the week. A second Max 5x seat, `work2`, was bought on 2026-11-24 so the work Mac no longer has to throttle. It needs a place in both machine types, and the work Mac needs a rotation of its own.

## What Changes

- Add `work2` as a **required account** on both machine types, with the same behaviour as `work`.
  - A personal machine requires `personal`, `work` and `work2`; `personal2` stays optional.
  - A work machine requires exactly `work` and `work2` and rejects any other account.
  - `--enroll work2` and `--reauth work2` work on both. The first enrollment on a work Mac ends with `work` active.
  - **BREAKING**: existing Macs report setup incomplete until `work2` is enrolled.
- Bump the claude-swap pin from 0.29.0 to 1.2.0.
  - The script contract stays the same: JSON `schemaVersion` 1, `auto --once` exit codes, and the `--service-status` line.
  - Since 1.0.0, `add --slot` keeps a slot's alias, hold-out, tier and line, so the setup's own hold-out restore goes away.
- Give each machine type its own **rotation policy**, both chosen from a re-simulation of the two Macs on the 1.2.0 engine and both marked as a trial.
  - **Work Mac (new)**: autoswitch on, `priority-consume-first`, `work` and `work2` at the same tier with line 95. **BREAKING**: replaces "work Mac keeps autoswitch off".
  - **Personal Mac**: `priority-consume-first`, `personal2` 100/95 and `personal` 10/80 do not change. `work` and `work2` share tier 50 and line 70 (was `work` 60).
  - Both machine types keep the same `settings.json`.
- The policy guarantees a wall-free work Mac up to 1.5× its measured demand while `personal2` is usable, and up to 1× in a month without it. For a heavier week, the manual tells the user to hold both work accounts out of the personal Mac's rotation.
- The setup turns autoswitch on through `cswap menubar --install-service --auto-switch`, on both machine types. It does so only on the run that completes the setup, after the dry run. Repair runs leave a paused menu paused.
- The reserve and the surplus are measured over both **work accounts**: the work Mac must never hit a wall, and the personal Mac spends what is left.
- Extend `log-weekly-stats.py` to four accounts for the trial review.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `claude-swap-account-policy`:
  - `work2` is required on both machine types, and the work-machine compliance rule changes to match;
  - there is one rotation policy per machine type: the work Mac gets autoswitch, and the personal Mac adds the `work2` tier and the new work-account line;
  - the trial record points to the new simulation;
  - manual choices on the work Mac hold only while autoswitch is paused;
  - the heavy-week hold-out of the work accounts is part of the operating contract.
- `claude-swap-install`:
  - pin 1.2.0;
  - `--enroll`/`--reauth work2`;
  - per-machine-type tiers and lines;
  - autoswitch activation through the upstream service flag;
  - `--reauth` relies on upstream to keep the runtime policy.
- `manual-web`: the Claude Code section documents `work2`, the work Mac's rotation, and the two trial policies, in place of "work Mac keeps only `work` with autoswitch off".

## Impact

- **Setup**:
  - `dot_local/bin/executable_claude-swap-setup.tmpl`: required aliases, the work-machine compliance rule, enroll/reauth targets, a rotation policy per machine type, `--auto-switch` on the completing run, and the hold-out restore removed.
  - `run_onchange_after_claude-swap-setup.sh.tmpl`: revision bump; it extracts the policy for both machine types.
- **Install**: `CLAUDE_SWAP_VERSION` in `run_onchange_install-packages.sh.tmpl` and in the setup command.
- **Managed config**: `private_dot_claude-swap-backup/private_settings.json` is unchanged and shared by both machine types.
- **Tests**: `tests/claude-swap.test.ts` and `tests/fixtures/claude-swap-autoswitch.py` move to the 1.2.0 engine and both policies. They need cswap 1.2.0 installed.
- **Simulation**: a two-Mac harness on the 1.2.0 engine inside this change folder, based on the archived `add-optional-claude-account/simulation`.
- **Docs**: Section 11 of `docs/manual.html`, the README if its claude-swap summary names the old policy, and `GLOSSARY.md` (work accounts, rotation policy, reserve, surplus, wall, switch line).
- **Work Mac**: behaviour changes. On the next apply it asks for `work2` and turns autoswitch on.
- **Tracking**: Beads `agentic-task-v4sb`.
