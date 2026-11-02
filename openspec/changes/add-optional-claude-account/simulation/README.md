# claude-swap rotation simulator

Drives the real `AutoSwitchEngine` from claude-swap 0.29.0 with a fake switcher, fake usage and a fake clock. No CLI, no Keychain, no network. Evidence for the trial policy in `../design.md`; published as https://claude.ai/artifact/6TgAbxVLuaYbFj3Psick5k (shared by link).

## Run

```sh
uv venv .venv
uv pip install --python .venv/bin/python 'claude-swap==0.29.0'
./run.sh harness.py                     # scenarios S1–S10 and one-day timelines
./run.sh week2.py draw10to15            # two work weeks, work Mac 10–15 %/day
./run.sh week2.py flat15                # same, 15 %/day
./run.sh week2tune.py draw10to15        # P1 with work lines 60/65/70
./run.sh week2tune.py flat15
./run.sh week2.py merge                 # writes results.json
python3 -I page/extract.py results.json page/data.json
```

`run.sh` sets `HOME` inside this directory; `harness.py` refuses to run otherwise and blocks sockets and subprocesses. Outputs (`results/`, `results.json`, `runs/`, `home/`, `.venv/`) are not committed.

To rebuild the page, replace `/*DATA*/null` in `page/template.html` with `page/data.json`.

## Files

- `harness.py`: engine driver, accounts, configs, snapshot scenarios, day timelines.
- `week2.py`: shared-work goal sim (personal Mac evenings and weekends, work Mac weekdays, app load on personal).
- `week2tune.py`: `week2.py` plus P1 variants with work lines 60, 65 and 70.
- `extras.py`, `probes2.py`: manual-switch revert, micro-switch gaps, per-account weekly line checks.
- `report.py`, `report2.py`: text summaries.
- `log-weekly-stats.py`: reads a real `~/.claude-swap-backup/claude-swap.log`; prints 7d before each weekly reset and when work crossed 95 %. Run with `python3 -I log-weekly-stats.py <log>`.

## Assumptions

Calibrated from the 2026-09/11 log: a Pro 5h moves about 1.1 %/min under heavy use, work (Max 5x) about 0.22 %/min, 7d about 1/6 of 5h. Demand is a ceiling (weekday evenings and weekends, all heavy), not the user's real pace. Polling is perfect; real polling sees inactive resets 5–10 min late.
