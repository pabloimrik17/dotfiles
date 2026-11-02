## Why

On the personal Mac, autoswitch rarely switches at 85 %. It waits until the active account is exhausted, and it drains `work`, which is shared with the work Mac: `work` reached 95 % or more before its weekly reset in 4 of the last 6 weeks. A third Pro subscription, `personal2`, paid only in some months, adds capacity but needs an order and per-account limits so that it does not repeat the same failure.

## What Changes

- Add `personal2` as an **optional account** on personal machines. It is enrolled with `claude-swap-setup --enroll personal2`, repaired with `--reauth personal2`, and never counted toward setup completeness. In unpaid months it is held out of rotation, and a lapsed login is tolerated without warnings. A work machine keeps treating any non-`work` account as non-compliant.
- Fix setup completeness. `--check` no longer requires `personal` to be active, so a correctly enrolled Mac no longer reports itself incomplete and is never force-switched to `personal`. `--enroll` and `--reauth` restore the account that was active before them. **BREAKING** for anyone relying on setup always ending on `personal`.
- Bump the claude-swap pin from 0.26.0 to 0.29.0 and verify the setup against it: public JSON v1, `add --slot`, `--service-status`, and the menubar's `/Applications/claude-swap Menubar.app` wrapper.
- Replace the autoswitch policy with a **trial** priority rotation, P1·60:
  - strategy `priority-consume-first`;
  - tiers `personal2` 100, `work` 50, `personal` 10;
  - `weeklyThreshold` unset;
  - per-account lines `personal2` 95, `work` 60, `personal` 80.

  The setup applies tiers and lines idempotently. The update check stays on, and nothing self-updates. **BREAKING**: replaces `best`, the shared 85 % threshold and the "conserve a healthy active account" rule.
- Record the trial: the design links the simulation artifact and states that the values are provisional and will be tuned from user feedback in a later change. The simulator ships inside this change folder.
- Keep `GLOSSARY.md` out of `$HOME` by adding it to the chezmoi ignore that chezmoi actually honours.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `claude-swap-account-policy`: optional `personal2` enrollment; setup completeness independent of the active account; trial priority rotation with tiers and per-account lines replacing the 85 % `best` policy; manual choices that hold only while autoswitch is paused; exhaustion behaviour under priority.
- `claude-swap-install`: pin 0.29.0; `--enroll`/`--reauth personal2`; setup applies the runtime-owned tiers and lines; the service refresh covers the menubar app wrapper.
- `manual-web`: the Claude Code section documents the three-account trial policy, optional `personal2`, the menu pause for deliberate `work` sessions, and the trial status, instead of the 85 % policy.

## Impact

- **Setup**: `dot_local/bin/executable_claude-swap-setup.tmpl` (completeness, enroll/reauth, active-account restore, tier/line application) and `run_onchange_after_claude-swap-setup.sh.tmpl` (`SETUP_COMMAND_REVISION` bump).
- **Install**: the `CLAUDE_SWAP_VERSION` pin in `run_onchange_install-packages.sh.tmpl`, the setup command and the offer script.
- **Managed config**: `private_dot_claude-swap-backup/private_settings.json` (strategy, no `weeklyThreshold`). Tiers and lines live in runtime `sequence.json` and are applied by the setup, not tracked.
- **Tests**: `tests/claude-swap.test.ts` and `tests/fixtures/claude-swap-autoswitch.py` move to the 0.29.0 engine API and the priority policy. They need cswap 0.29.0 installed.
- **Docs**: Section 11 of `docs/manual.html`; README only if its claude-swap summary names the old policy.
- **Repo hygiene**: `GLOSSARY.md` (new, root) and the chezmoi ignore entry.
- **Work Mac**: no behaviour change; it keeps only `work` with autoswitch off.
- **Tracking**: Beads `agentic-task-tsvi`.
