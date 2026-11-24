# Two-Mac claude-swap rotation simulator

Drives two real `AutoSwitchEngine` instances from claude-swap 1.2.0, one per Mac, over four shared fake accounts with a fake clock. No CLI, no Keychain, no network. Evidence for `../design.md`. Based on the archived `add-optional-claude-account/simulation` (0.29.0, one Mac), which stays frozen.

## Run

```sh
uv venv .venv
uv pip install --python .venv/bin/python 'claude-swap==1.2.0'
./run.sh twomac.py calibrate     # work-Mac demand check: busiest 5h window per day
./runall.sh                      # the 72 runs + 3 status-quo runs, merge, report -> summary.txt
./probes.sh                      # L=50 floor, work Mac alone at x2, peakFri and flat day profiles
./run.sh twomac.py merge         # fold every run in results/runs/ into results.json
./run.sh report.py peakFri       # -> summary-peakFri.txt (also: flat)
```

`runall.sh` and `probes.sh` run 8 shards in parallel (`SHARDS=n` to change); one run takes about 20 s. `run.sh` sets `HOME` inside this directory; `harness.py` refuses to run otherwise, checks that `claude_swap` comes from `.venv`, and blocks sockets and subprocesses. `results/`, `runs/`, `home/` and `.venv/` are not committed; `results.json` and `summary*.txt` are.

Real log, read-only:

```sh
python3 -I log-weekly-stats.py ~/.claude-swap-backup/claude-swap.log <(cswap list --json)
```

It prints, per account, the 7d before each weekly reset, and for `work` and `work2`: 7d added while this Mac was on another account (the work Mac or claude.ai), 7d added while this Mac was on it, the first reading at or above 95 % per week, and the 7d left unused at each reset. Weeks are split at each observed reset, not by ISO week.

## Files

- `harness.py`: sandbox, fake switcher (sequence answers run the real `ClaudeAccountSwitcher` code), shared accounts, one engine driver per Mac.
- `twomac.py`: the two-Mac model, metrics, `calibrate`, `run`, `merge`.
- `report.py`: wall matrix, every run, the selection rule, the relaxed rule and the x2 trade-off.
- `runall.sh`, `probes.sh`, `run.sh`: batch and sandbox wrappers.
- `log-weekly-stats.py`: the real-log reader, four accounts.

## Model

Accounts are account-wide and shared by both Macs, each with independent 5h and 7d windows. Weekly resets in CET (UTC+1, November): `work` Wed 12:00, `personal` Fri 08:00, `work2` Sat 13:00, `personal2` Sat 22:00. A 5h window opens at first use and closes 5 h later.

Both engines: `threshold` 85 (only the ruler: every account has its own line), `weeklyThreshold` unset, so each per-account line governs both windows; `intervalSeconds` 60, `cooldownSeconds` 300, `hysteresisPct` 10, `unhealthyTicks` 3, no model limits, API-key accounts excluded. Each Mac has its own sequence, tiers, lines, state file and active account. Engines tick every 60 s around the clock (jitter pinned) and see exact, fresh usage of their own accounts.

- **Personal Mac**: `priority-consume-first`; `personal2` 100/95, `work` 50/L, `work2` 50/L, `personal` 10/80, L in 60/70/80 (50 as a probe). Starts on `personal2`.
- **Work Mac**: `work` and `work2` only, both at tier 50 and line W in 95/98; strategy S in `best`, `weekly-first`, `consume-first`, `priority-consume-first`. Starts on `work`. Status quo: no engine, stays on `work`, personal Mac at L 60.

Rates, as calibrated in the archived README: Pro 5h about 1.1 %/min heavy, Max 5x 0.22 %/min, 7d about 1/6 of 5h.

Demand:

- **Personal Mac**: the `week2.py` ceiling, all heavy: weekdays 19–24 CET, weekends 10–13 and 16–20. It is an upper bound, not the user's pace, so its walls and its surplus spend are upper bounds too.
- **App**: on `personal` only, 30 points of 7d a week in three 10-min bursts a day (08:00, 12:30, 17:30), 5h at 6x.
- **Work Mac**: weekdays 08–20 CET, flat within the day. A day carries `16 x demand x factor` points of a Max 5x 7d window, with 5h at 6x. Factors Mon..Fri are 1.0, 2.2, 0.4, 1.0, 0.4 (`peakTue`): mean and median 1.0, so the median day is 16 points and every 7-day window holds exactly 80/120/160 points at x1/x1.5/x2. `peakFri` moves the peak to Friday (1.0, 0.4, 1.0, 0.4, 2.2); `flat` is 1.0 every day.

Calibration (`./run.sh twomac.py calibrate`): at x1 the busiest 5h window per working day has a median of 40 % and a peak of 88 %, against the measured 41 % median and peaks near 90 %. The same profile gives 80 % median and 176 % peaks at x2, so a x2 peak day needs both work accounts' 5h windows.

Window: warm-up from Mon 2026-11-02 00:00 CET with every 7d at 0; metrics over Sun 11-08 00:00 to Sun 11-22 00:00 CET. That holds two resets of every account, and each measured reset closes a fully simulated week.

## Metrics

- **Work-Mac wall**: a work-Mac demand minute with its active account exhausted (5h or 7d at 100 %) and no other work account below W on both windows. `atLimitMin` counts every exhausted demand minute; `unservedMin` is the demand lost. Status quo: every exhausted minute is a wall.
- **Personal-Mac walls**: the unserved fraction of its demand minutes, as in D3.
- **Surplus**: personal-Mac 7d points per week on `work` and `work2`.
- `personal2` 7d at each reset; app shortfall minutes (`personal` at 100 % during an app burst); switches per Mac and gaps under 10 and 15 min; unused 7d per work account at each reset (100 - 7d).
- Per switch: trigger, both accounts' windows, landing room under the target's line, dwell. Per work-Mac at-limit episode: start, length, both work accounts' windows.

## Not simulated

Real polling sees inactive accounts 5–10 min late and the engine polls adaptively; here every tick reads exact usage. Claude Code's 30 s Keychain pickup, claude.ai use of the work accounts, 429 backoff, token refresh, sleep or lid-closed Macs and manual switches are absent. Demand is deterministic and the day profile repeats every week, so each run sees one alignment of peak days against resets; `peakFri` and `flat` probe two others.
