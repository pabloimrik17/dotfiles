## Context

See proposal.md, Why. Current state on the personal Mac (2026-11-02):

- `claude-swap-setup` treats the setup as complete only when `personal` is active. With `work` active, `--check` exits 2, and a re-run force-switches to `personal`.
- The 0.26.0 policy uses `best` with one 85 % line for every window. Log evidence for the failures:
  - Most late switches were by design: `work`'s 7d sat at 88–91 %, so it was never a proactive target.
  - On 10-23 `work` returned http-401 and stayed unreadable for six days without any notice.
  - `work` reached 95 % or more before its Wednesday reset in 4 of 6 weeks.
- Plans: `work` Max 5x, shared with the work Mac, which uses 10–15 % of its week per working day. `personal` Pro, shared with the Claude app. `personal2` Pro, Claude Code only, paid in some months and never upgraded.
- Constraints:
  - Upstream owns the engine, LaunchAgent, credentials and `sequence.json`.
  - The spec forbids a custom watcher.
  - Glossary terms: optional account, rotation, held out of rotation, switch line, priority tier, reserve, surplus, wall (`GLOSSARY.md`).

## Goals / Non-Goals

**Goals:**

- The work Mac never finds `work` exhausted because of the personal Mac.
- `personal2` is consumed whenever it has room, and it costs nothing to keep it enrolled while unpaid.
- Every runtime value comes from the repository through upstream commands.

**Non-Goals:**

- Hard usage caps, notifications or any switching logic of our own.
- Calendar-aware reserves (holidays) or an hourly reserve job.
- Lapsed-plan detection; the user holds `personal2` out by hand.
- Cross-Mac usage sharing (`import-usage`).
- Any change to the work Mac's behaviour.

## Decisions

### D1. `personal2` is a fixed optional alias, not a generic optional list

The setup gains `--enroll personal2` and allows `--reauth personal2` on personal machines only. Completeness ignores it. A generic "N optional accounts" mechanism would add configuration surface for one known account.

### D2. Completeness depends on aliases only; captures restore the previous account

`setup_is_complete` checks only the required aliases (and, on work machines, that no other account exists). `personal` is selected only when the run itself enrolled a missing required account. `--enroll` and `--reauth` record the active alias before the `/login` capture and switch back to it afterwards. A capture refuses when the current login is already enrolled under another alias or slot, because upstream `add --alias` overwrites that account's alias and `add --slot` moves it.

Alternative rejected: keep forcing `personal`. It contradicts "restart preserves the active identity", and the offer script would show a false "incomplete" after this change bumps `SETUP_COMMAND_REVISION`.

### D3. Trial policy P1·60: `priority-consume-first` with tiers and per-account lines

All candidates below were run through the real 0.29.0 engine, over two simulated work weeks:

| Config | Personal Mac walls | Work Mac at 100 % (10–15 %/day · 15 % flat) | `personal2` at reset |
|---|---|---|---|
| A `best` 85/95 | 3 % | 2051 · 2255 min | 24–50 % |
| P0 tiers only, 85/95 | 3 % | 1230 · 1594 min | 82–95 % |
| P1 tiers + lines (work 55) | 31 % | 0 · 0 | 90–97 % |
| **P1·60 (work 60)** | **25 %** | **0 · 0** | **90–96 %** |
| P1·65 | 21 % | 0 · 0 (102 · 360 min ≥ 95 %) | 90–96 % |
| P1·70 | 13 % | 102 · 362 min | 90–95 % |
| P2 hourly shrinking work reserve | 15 % | 114 min | 90–95 % |
| P1 with `personal` disabled | 38 % | 102 min | 90–100 % |

Simulation: https://claude.ai/artifact/6TgAbxVLuaYbFj3Psick5k (shared by link). Harness and assumptions: `simulation/README.md`. The demand used is a ceiling: weekday evenings and weekends, all heavy. The user's real pace is lower, so walls are an upper bound.

Engine facts that drove the choice, all observed in the simulation:

- **`best` cannot serve `personal2`.** It never leaves an account that is below its line. `work` (Max 5x) climbs about 5× slower than a Pro, so `best` parks on `work` and drains it.
- **Priority returns to a higher tier as soon as that tier is usable** (cooldown 300 s), and never lands on an account above its lines, even at-limit.
- **A per-account line covers the weekly window only when `weeklyThreshold` is unset.** The same number is then also that account's 5h line. Valid range 50–99.9.
- **Lines are not caps.** When nothing qualifies, the engine stays on the active account until it is exhausted, so the last account in use absorbs any overflow.

Why 60 for `work`: it is the highest line with zero work-Mac minutes at 100 % under both work-Mac loads. Why `personal` stays in rotation at 80: disabling it moves the overflow onto `work` (102 min at 100 %), while with P1·60 the app lost 6 pts in two weeks. Why `personal2` at 95: it is Claude Code-only, so the line is purely a safety margin. 95 → 100 % takes about 4.5 min at the observed Pro pace, and the 60 s polling sees it in time.

Alternatives rejected:

- `consume-first`: switches below the line with no hysteresis, and has open upstream bugs #305, #288 and #325.
- `best` with per-account lines as a bias: rarely changes the ranking, because fresh windows all score 100.
- P2 (an hourly `cswap threshold work N` job): halves the walls, but costs work-Mac time and needs a custom job the spec forbids.

### D4. Settings split: `settings.json` for globals, setup for per-account values

`private_settings.json` keeps the schema-v1 globals:

- `strategy: priority-consume-first` and `threshold: 85`, which is the fallback for any account without a line;
- interval 60, cooldown 300, `hysteresisPct` 10 (unused by priority but kept declared), `includeApiKeyAccounts: false` and `unhealthyTicks: 3`;
- no `weeklyThreshold` and no `model`; `updates.check` is left at its upstream default.

Tiers and lines are per-account records in runtime `sequence.json`. The setup sets them with `cswap priority <alias> <tier>` and `cswap threshold <alias> <pct>`, both of which accept aliases, and only for enrolled aliases. The values are declared once in the setup template.

A new non-interactive `claude-swap-setup --apply-policy` mode runs from `run_onchange_after_claude-swap-setup.sh.tmpl` on every rendered change, before the completeness offer. It does nothing on work machines. Its hash inputs include the declared values, so editing a value re-applies it on the next `chezmoi apply` without a prompt.

Alternative rejected: tracking `sequence.json`. It also holds credentials metadata and slot state, and upstream owns it.

### D5. Pin 0.29.0 and what the setup must re-verify

These still hold in 0.29.0: `list`/`status --json` keep `schemaVersion: 1`, `disabled` and `threshold` are additive row fields, `--service-status` still prints `Menu bar service:`, and the `auto --once` exit codes are unchanged (0/1/2/3).

The menubar now builds `/Applications/claude-swap Menubar.app` on every start. It is upstream-owned and untracked, and `CLAUDE_SWAP_NO_BUNDLE` is not set.

Released 2026-10-28. The install helpers keep the exact-pin and menubar-runtime checks.

### D6. Tests move to the 0.29.0 engine

`tests/fixtures/claude-swap-autoswitch.py` is rebuilt on the simulator's fake switcher. The fake switcher holds `sequence.json` in memory, with real `UsageEntry` rows and a fake clock. The fixture asserts the priority matrix:

- return to a higher tier;
- line departure;
- no landing above a line;
- blocked when nothing qualifies;
- a manual choice reverted on the next tick;
- the three-unhealthy-ticks failover;
- stale-429 behaviour.

The parser test checks the new keys. Tests require `cswap 0.29.0`, the same live-tool dependency as today.

### D7. Repository hygiene

`GLOSSARY.md` is added to `.chezmoiignore.tmpl`. That template is the effective ignore: `openspec/`, `docs/` and `README.md` do not reach `$HOME`. `tests/` is missing from it and already leaks to `~/tests`. Adding `tests/` is a one-line fix in the same file. Removing the stale `~/tests` is left to the user.

## Trial

The tiers and lines are provisional. There is no fixed duration: the user reports how the rotation behaves in real use. That feedback, the simulation artifact, this design and the harness feed a follow-up change that retunes or replaces the policy.

Review method, no new tooling:

- Analyse `~/.claude-swap-backup/claude-swap.log` with `simulation/log-weekly-stats.py`, plus switch timing.
- Optionally re-simulate with the observed demand.

Criteria:

1. The work Mac never finds `work` exhausted. This is the primary criterion; if it fails, lower `work`'s line.
2. `personal2` ends its weeks above 85 % in paid months.
3. The app on `personal` is not short.
4. No repeated switches less than 10–15 min apart.

## Risks / Trade-offs

- [The personal Mac hits walls in heavy weeks] → Accepted: that is the user's current practice of slowing Claude Code. A manual `cs-global` onto an account above its line is respected while nothing else qualifies.
- [Lines are not caps, so the last account in use can pass its line] → `personal` sits last as the designated overflow; this is documented in the manual.
- [Priority mode sends no "all exhausted" notification, unlike `best`] → Accepted for the trial: the engine's `BLOCKED` is visible through `cswap auto --once --dry-run` and the menu's usage rows. Notifications stay a non-goal; feedback can reopen it.
- [A manual `work` choice (Fable) is reverted within a minute] → The manual documents pausing Auto-switch in the menu.
- [The real poller sees an inactive account's reset 5–10 min late] → This only delays a return to a higher tier; it is harmless.
- [A forgotten `cswap disable personal2` while unpaid] → Upstream behaviour for a lapsed plan is unverified (#350, #499). It could be chosen if its usage reads 0 %. The manual makes "unpaid month → disable" the rule.
- [0.29.0 is young] → The exact pin, the tests against the live tool, and rollback by pin revert.

## Migration Plan

1. Land the pin and policy together; `chezmoi apply` installs 0.29.0, refreshes the service and applies tiers and lines.
2. Optional: `claude-swap-setup --enroll personal2`.
3. Verify with `cswap priority`, `cswap threshold` and `cswap auto --once --dry-run`.

Rollback: revert the change. `chezmoi apply` restores pin 0.26.0 and the 85 % `best` settings. Optionally run `cswap priority <alias> --unset` and `cswap threshold <alias> --unset` for each account first, before the revert/apply: 0.26.0 has neither command. Leaving them is harmless, since 0.26.0 ignores those per-account fields.
