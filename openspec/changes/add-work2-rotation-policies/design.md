## Context

The motivation is in proposal.md, Why. State on 2026-11-24:

- **Personal Mac.** cswap 0.29.0, running the trial P1·60 from `add-optional-claude-account`.
  - Account 4 was captured today and aliased `work2` at runtime. As an interim it also got tier 50 and line 60 at runtime.
  - Its 7d resets Sat 13:00 CET, while `work`'s resets Wed 12:00. The two seats report independent windows.
- **Work Mac.** Only `work`, autoswitch off. The setup rejects any other account.
- **Trial log, 2026-11-03 to 11-24, personal Mac.**
  - `work` hit 100 % with no personal-Mac use; the work Mac spends a median of 16 points a day, peaking at 32.
  - The personal Mac had no true wall.
  - `personal2` ended its weeks at 98 % and 100 %; the week at 47 % was a manual hold-out.
  - Engine switches were never under 15 min apart; the 10 short gaps came from manual actions.
- **Upstream 1.2.0 (2026-11-21).** It adds `weekly-first` (0.30.0) and gives `consume-first` a room margin (1.1.0, #504).
  - `add --slot` keeps alias, hold-out, tier and line (1.0.0, #358). `add --alias` on an enrolled, unaliased active login sets the alias in place.
  - `menubar --install-service [--auto-switch | --no-auto-switch]` writes `auto_switch_enabled` only when a flag is given.
  - The plan label (lapsed = Free) is display-only; the engine ignores it.
  - Unchanged:
    - `list`/`status --json` keep `schemaVersion` 1, with `plan` as a new optional row field;
    - the `auto --once` exit codes 0/1/2/3;
    - the `Menu bar service:` status line;
    - every key of our `settings.json` is still read.
- **Constraints.** Upstream owns the engine, LaunchAgent, credentials and `sequence.json`. No custom watcher. Glossary terms in `GLOSSARY.md`: work accounts, rotation policy, reserve, surplus, wall, switch line.

## Goals / Non-Goals

**Goals:**

- The work Mac never hits a wall up to 1.5× its measured weekday demand.
- The personal Mac spends the work accounts' surplus, and `personal2` stays first.
- One rotation policy per machine type, declared in the repository and applied through upstream commands.

**Non-Goals:**

- A guarantee at 2× work demand (see D3), or any automatic heavy-week detection.
- Our own notifications, warnings or watcher; model-specific limits; lapsed-plan automation.
- Cross-Mac usage sharing (`import-usage`).
- Reading the work Mac's log for the trial review.

## Decisions

### D1. `work2` is a required work account, like `work`

`work2` is required on both machine types:

- the personal Mac requires `personal`, `work` and `work2`; `personal2` stays optional;
- the work Mac requires exactly `work` and `work2`, and one of them must be the current login: setup switches an unmanaged login back to `work`, as the old `work`-active rule did;
- `--enroll work2` and `--reauth work2` are valid on both.

The first enrollment on a work Mac still ends on `work`. Adopting the already captured account 4 works through `cswap add --alias work2` (1.2.0 sets the alias in place) or a runtime `cswap alias`.

Alternative rejected: optional like `personal2`. `work2` is paid by the employer and permanent. Leaving it optional would let a work Mac report itself complete with a single account, which is the failure this change addresses.

### D2. Pin 1.2.0

The pin is set in three places: `CLAUDE_SWAP_VERSION` in `run_onchange_install-packages.sh.tmpl`, in the setup command, and in the offer script.

- `--reauth` drops its own hold-out restore, because `add --slot` now keeps it. The "recapture keeps the runtime policy" test stays as the guard.
- Nothing else in the script contract changes (see Context).
- The `cswap run` history sharing introduced in 0.30.0 does not touch our global-switch workflow.

### D3. Policies chosen from a two-Mac simulation on the 1.2.0 engine

The simulation lives in `simulation/` (README there). It runs two real `AutoSwitchEngine` instances, one per Mac, over four shared fake accounts for two weeks.

- **Work Mac demand.** Weekdays 08–20, at 16 points a day (×1), with a Tuesday peak of 2.2× a normal day.
- **Personal Mac demand.** The P1·60 ceiling.
- **Grid.** 72 runs, plus a status quo and 230 probes.

Work-Mac wall minutes at ×1 / ×1.5 / ×2:

| Work-Mac strategy | W | L 60 | L 70 | L 80 |
|---|---|---|---|---|
| `best` (`weekly-first` identical) | 95 | 0 / 46 / 414 | 0 / 76 / 413 | 0 / 76 / 414 |
| `consume-first` | 95 | 0 / 46 / 284 | 0 / 0 / 284 | 0 / 0 / 351 |
| `priority-consume-first` | 95 | 0 / 0 / 382 | **0 / 0 / 380** | 0 / 0 / 453 |
| `priority-consume-first` | 98 | 0 / 0 / 339 | 0 / 0 / 349 | 0 / 0 / 385 |
| status quo (work Mac on `work` only) | – | 0 / 1435 / 1756 | | |

W is the work Mac's line on both work accounts. L is the personal Mac's line on both.

**Chosen:**

- **Work Mac:** `priority-consume-first`, `work` and `work2` at tier 50 with line 95.
- **Personal Mac:** `personal2` 100/95, `work` 50/70, `work2` 50/70 and `personal` 10/80.

At ×1 and ×1.5 this gives no wall on either Mac, `personal2` at 95 % at every reset, no app shortfall, and no switch gap under 10 min.

**Why criterion 1 stops at ×1.5.** No configuration is wall-free at ×2, not even L 50, the engine's minimum line. Two facts explain it:

- The work accounts give 200 points a week. The work Mac needs 160 at ×2 and the personal Mac's ceiling takes about 67.
- Both Macs prefer the account with the sooner reset. The personal Mac's weekend therefore leaves `work` 7d-spent by Tuesday, and Tuesday's peak runs on `work2`'s 5h window alone.

Two probes confirm the cause. With the personal Mac idle, the work Mac alone at ×2 is wall-free. With flat days, ×2 is wall-free at every L. The user expects ×2 to be rare, so ×2 is handled by D8 rather than by the lines.

**Why `priority-consume-first` on the work Mac:**

- It ties with `consume-first` at ×1 and ×1.5.
- It never lands above a line, whereas `consume-first` escaped above one 21 times.
- It keeps one shared `settings.json`.

`consume-first`'s about 100 fewer wall minutes at ×2 are not a clear win in a scenario we do not guarantee. `best` and `weekly-first` wall at ×1.5.

**Why L 70, not the highest passing L (80).** The personal Mac's ceiling is already met at L 60: 66.8 points a week at ×1 for every L. L 80 adds 2.3 points a week at ×1.5 but 73 more wall minutes at ×2. L 70 adds 1 point at ×1.5, has the same ×2 walls as L 60 (380 against 382), and makes fewer personal-Mac switches (28 against 31). The line also caps the 5h window, so L 60 drops long evening sessions to `personal` sooner.

**Why W 95, not 98.** W 98 has about 30–45 fewer wall minutes at ×2. But at ×1.5 it spends 69–103 min at or above 95 %, against 0–1 min with W 95. The simulation polls perfectly and cannot see stale usage (#208, still open), so W 95 keeps that margin.

Alternatives rejected:

- `consume-first` on the work Mac, for the reasons above.
- A fixed personal-Mac order (`work2` above `work`) to split the two Macs' load; not simulated (see Open Questions).
- Holding the work accounts out of the personal Mac permanently: at ×1, 13–40 % of each would be left unused at every reset.

### D4. One policy declaration per machine type in the setup template

`ROTATION_POLICY` becomes two one-line declarations, `ROTATION_POLICY_PERSONAL="personal2:100:95 work:50:70 work2:50:70 personal:10:80"` and `ROTATION_POLICY_WORK="work:50:95 work2:50:95"`, each in the same `alias:tier:line` format. The setup picks one by `MACHINE_TYPE`.

`apply_rotation_policy` and `--apply-policy` run on both machine types. Declared accounts that are not enrolled are still skipped.

The offer script extracts both lines by regex into its run_onchange hash, runs `--apply-policy` on both machine types, and bumps `SETUP_COMMAND_REVISION` to 3.

Alternative rejected: one templated line rendered per machine type. The offer script includes the raw setup template and regex-matches a literal line, so template code on that line would break the extraction.

### D5. `settings.json` stays shared and unchanged

Both machine types use the existing `private_settings.json`:

- `priority-consume-first`;
- global threshold 85, the fallback for accounts without a line;
- interval 60, cooldown 300, hysteresis 10, unhealthy 3;
- API keys excluded; no `weeklyThreshold`; no model limit.

### D6. Autoswitch turns on in the run that completes the setup

The menu service is installed with `cswap menubar --install-service --auto-switch` only when the run enrolled the last missing required account, after `cswap auto --once --dry-run`.

- **Pending marker.** That run writes `$XDG_STATE_HOME/dotfiles/claude-swap-autoswitch-pending` before its first capture and removes it after the `--auto-switch` install. While it exists, every setup run passes the flag, so a run that fails after a capture is finished by the next one.
- **Dry run.** It now runs on both machine types. A failure stops a run that passes `--auto-switch`; any other run warns and still refreshes the service.
- **All other runs** (repair, `--reauth`, `--enroll personal2`, and the installer's pin-change refresh) install or refresh without a flag, so a menu pause survives them.
- **`menubar_settings.json`** stays app-owned.
- **Migration.** The work Mac turns autoswitch on for the first time when it enrolls `work2`. The personal Mac is already complete, with `work2` aliased, so nothing changes there.

Alternative rejected: keep asking the user for the menu toggle. A supported flag now exists, and the work Mac would otherwise stay off after the migration.

### D7. Tests move to 1.2.0 and both policies

`tests/fixtures/claude-swap-autoswitch.py` runs on the 1.2.0 engine with `harness.py`'s fake switcher. It asserts:

- the work-Mac tier rule: sooner reset first, never landing above 95, blocked when both are above their lines;
- the personal-Mac matrix with `work2`;
- a manual choice within the work tier reverted on the next tick.

`tests/claude-swap.test.ts` covers:

- the new required aliases and the work-machine compliance rule;
- `--enroll work2` and `--reauth work2` on both machine types;
- adopting an unaliased login;
- per-machine-type tiers and lines, and `--apply-policy` on a work machine;
- `--auto-switch` only on the completing run, and on later runs while its activation is pending;
- a failed dry run stopping only an activating run;
- a work Mac with an unmanaged login reported incomplete and switched back to `work`;
- the hold-out kept across `--reauth` with no restore call;
- the offer hash covering both policy lines.

Tests still need the live `cswap` at the pin. Implementation installs 1.2.0 with the installer's own `uv tool install` command.

### D8. Heavy work weeks: a documented manual hold-out

For a week expected above ×1.5, the user runs `cswap disable work` and `cswap disable work2` on the personal Mac from the weekend before, and `cswap enable` afterwards. The setup never enables a held-out account and never warns about one. The manual documents the rule and the ×1.5 limit.

### D9. Trial and review

Both policies are a trial. The review uses the personal-Mac log and `simulation/log-weekly-stats.py`, which now covers four accounts.

- **Work-Mac demand.** A rise on a work account this Mac is not on comes from the work Mac or claude.ai.
- **A work-Mac wall** shows as both work accounts exhausted or above 95 %.
- **Blind spot.** Only spans when both Macs sit on the same account cannot be separated.

Criteria, in order:

1. no work-Mac wall at the observed demand;
2. the personal Mac spends surplus;
3. `personal2` above 85 % at its resets in paid months;
4. no app shortfall;
5. no engine switches under 10–15 min apart.

## Risks / Trade-offs

- [A week above ×1.5 walls the work Mac] → D8 hold-out. Upstream's `BLOCKED` state and the menu's usage rows make it visible.
- [Both Macs drain the same work account first] → Accepted. It only matters above ×1.5; see Open Questions.
- [The day profile is an assumption: the Tuesday peak is 2.2× a normal day] → `peakFri` and `flat` probes bracket it, and the trial review measures the real profile.
- [`priority-consume-first` lands just under a line (92–94.8 against 95) and leaves 5–21 min later; 2 ping-pongs in 18 runs] → Accepted, since gaps stayed over 5 min. The trial checks criterion 5.
- [Stale usage on HTTP 429 (#208)] → W 95 leaves margin. A manual switch remains the recovery path.
- [`personal2` lapses unnoticed] → The engine ignores the Free label, so the rule "unpaid month → `cswap disable personal2`" stays manual.
- [1.2.0 is three days old] → Exact pin, tests against the live tool, rollback by pin revert.
- [A work Mac that captured `work2` before this lands is reported non-compliant] → Nothing is deleted. Applying this change clears the error.
- [`work2` was captured by hand: setup sees a complete setup and leaves autoswitch off, since it cannot tell it from a pause] → Upstream warns `auto-switch: off` on each service refresh and the menu's health row shows it. The manual's recovery row gives `cswap menubar --install-service --auto-switch`. A completing run that fails after a capture is covered by the pending marker (D6).
- [Autoswitch on can revert a `--reauth` login before the capture] → The prompt and the manual tell the user to pause Auto-switch first.

## Migration Plan

1. **Land the change.**
2. **Personal Mac.** Run `chezmoi update`; the source must be synced.
   - It installs 1.2.0 and refreshes the service.
   - `--apply-policy` sets `work` 50/70 and `work2` 50/70.
   - `--check` is already complete.
3. **Work Mac.** Run `chezmoi update`.
   - It installs 1.2.0, and `--apply-policy` sets tiers and lines on `work`.
   - The offer then reports the setup incomplete: `/login` as `work2`, capture it, end on `work`, run the dry run, and install the service with `--auto-switch`.
4. **Verify on both Macs** with `cswap priority`, `cswap threshold`, `cswap auto --once --dry-run` and the menu's health row.

Rollback:

1. Revert the change and apply it: the 0.29.0 pin and the old setup come back.
2. On the work Mac, run `cswap menubar --install-service --no-auto-switch` (the old setup never turns autoswitch off) and remove `work2` explicitly if wanted.
3. Optionally `cswap priority/threshold <alias> --unset` for the work-Mac accounts and `work2`.

## Open Questions

- Would a fixed personal-Mac order, `work2` above `work` (or the reverse), split the two Macs' load and remove the ×2 walls? This can be answered in the trial review without changing this change's specs or tasks.
