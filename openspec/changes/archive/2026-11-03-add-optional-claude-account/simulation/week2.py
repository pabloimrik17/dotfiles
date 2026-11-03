"""Shared-work goal sim: work is also used by the work Mac (autoswitch off there).

Same real engine and fakes as harness.py. Usage:
  run.sh week2.py <case>    one work-Mac case (draw10to15 | flat15) -> results/week2-<case>.json
  run.sh week2.py merge     fold both into results.json
"""

import json
import random
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import harness as h  # noqa: E402
from claude_swap.autoswitch import AutoSwitchEngine  # noqa: E402
from claude_swap.models import ACCOUNT_THRESHOLD_MIN, normalize_account_threshold  # noqa: E402
from claude_swap.settings import AutoSwitchSettings  # noqa: E402

W, P, P2 = h.SLOT["work"], h.SLOT["personal"], h.SLOT["personal2"]
PCF = "priority-consume-first"
TIERS = {P2: 100, W: 50, P: 10}
UNSET = "`cswap config unset autoswitch.weeklyThreshold`"
CONFIGS = {
    "A": dict(strategy="best", weekly=95.0, tiers={}, lines={},
              native="strategy best; threshold 85; weeklyThreshold 95"),
    "P0": dict(strategy=PCF, weekly=95.0, tiers=TIERS, lines={},
               native="strategy priority-consume-first; threshold 85; weeklyThreshold 95; "
                      "cswap priority personal2 100, work 50, personal 10. Identical to B."),
    "P1": dict(strategy=PCF, weekly=None, tiers=TIERS, lines={W: 55.0, P: 80.0, P2: 95.0},
               native=f"P0 + {UNSET}; cswap threshold work 55; personal 80; personal2 95 "
                      "(each line now governs that account's 5h AND 7d)"),
    "P2": dict(strategy=PCF, weekly=None, tiers=TIERS, lines={P: 80.0, P2: 95.0}, work_schedule=True,
               native=f"P1 but hourly `cswap threshold work <clamp(100-15*workdaysLeft, 50, 95)>` "
                      "(brief says 40..95; below 50 is rejected natively)"),
    "P3": dict(strategy=PCF, weekly=None, tiers=TIERS, lines={P2: 95.0}, work_schedule=True,
               personal_schedule=True,
               native="P2 + hourly `cswap threshold personal <clamp(100-4.5*calendarDaysLeft, 50, 95)>`"),
    "P1-noPersonal": dict(strategy=PCF, weekly=None, tiers=TIERS, lines={W: 55.0, P2: 95.0}, disabled={P},
                          native="P1 + `cswap disable personal` (variant)"),
    "P2-noPersonal": dict(strategy=PCF, weekly=None, tiers=TIERS, lines={P2: 95.0}, work_schedule=True,
                          disabled={P}, native="P2 + `cswap disable personal` (variant: closest native fit to O1+O2'+O3)"),
    "P0-noPersonal": dict(strategy=PCF, weekly=95.0, tiers=TIERS, lines={}, disabled={P},
                          native="P0 + `cswap disable personal` (personal manual-only)"),
}

T0 = datetime(2026, 11, 2, 9, 0, tzinfo=timezone.utc).timestamp()     # Mon 09:00 (warm-up)
MEAS0 = datetime(2026, 11, 4, 12, 0, tzinfo=timezone.utc).timestamp()  # Wed 12:00 work reset
END = datetime(2026, 11, 18, 12, 0, tzinfo=timezone.utc).timestamp()   # two full work weeks
RESETS = {
    W: datetime(2026, 11, 4, 12, 0, tzinfo=timezone.utc).timestamp(),   # Wed 12:00
    P: datetime(2026, 11, 5, 8, 0, tzinfo=timezone.utc).timestamp(),    # Thu 08:00
    P2: datetime(2026, 11, 7, 10, 0, tzinfo=timezone.utc).timestamp(),  # Sat 10:00
}
START_7D = {W: 40.0, P: 30.0, P2: 10.0}
PRO_HEAVY, D7_RATIO = 1.1, 6.0
UNITS = {W: 5.0, P: 1.0, P2: 1.0}
APP_BURSTS = ((8, 0), (12, 30), (17, 30))
APP_7D = 30.0 / (7 * 3 * 10)  # 30 pts/week: 3 x 10-min bursts a day
SEED = 20261102


def workmac_daily(case: str) -> dict[str, float]:
    rng = random.Random(SEED)
    out, t = {}, T0
    while t < END:
        dt = datetime.fromtimestamp(t, tz=timezone.utc)
        if dt.weekday() < 5:
            out[dt.strftime("%Y-%m-%d")] = 15.0 if case == "flat15" else round(rng.uniform(10, 15), 2)
        t += h.D
    return out


def wd_min(t):
    dt = datetime.fromtimestamp(t, tz=timezone.utc)
    return dt.weekday(), dt.hour * 60 + dt.minute


def personal_mac_demand(t):
    wd, m = wd_min(t)
    if wd < 5:
        return PRO_HEAVY if m >= 19 * 60 else 0.0
    return PRO_HEAVY if (600 <= m < 780 or 960 <= m < 1200) else 0.0


def app_rate(t):
    _, m = wd_min(t)
    return APP_7D if any(hh * 60 + mm <= m < hh * 60 + mm + 10 for hh, mm in APP_BURSTS) else 0.0


def workdays_left(t, reset):
    """Working-day fraction left before `reset` (Wed 12:00): Wed pm 0.5, Thu, Fri,
    Mon, Tue 1 each, Wed am 0.5; each segment drains linearly over its own hours."""
    prev = reset - 7 * h.D
    total = 0.0
    day = datetime.fromtimestamp(prev, tz=timezone.utc).replace(hour=0, minute=0).timestamp()
    while day < reset:
        if datetime.fromtimestamp(day, tz=timezone.utc).weekday() < 5:
            w0, w1 = day + 9 * h.H, day + 18 * h.H
            segs = []
            if w0 < reset < w1:
                segs.append((w0, reset, 0.5))
            elif w0 < prev < w1:
                segs.append((prev, w1, 0.5))
            elif prev <= w0 and w1 <= reset:
                segs.append((w0, w1, 1.0))
            for a, b, v in segs:
                total += v * min(1.0, max(0.0, (b - max(t, a)) / (b - a)))
        day += h.D
    return total


def native_line(raw, lo, hi):
    line = round(min(hi, max(lo, ACCOUNT_THRESHOLD_MIN, raw)), 1)
    normalize_account_threshold(line)  # what `cswap threshold` would accept
    return line


def in_meas(t):
    return MEAS0 <= t < END


def run(cname, case):
    cfg = CONFIGS[cname]
    daily = workmac_daily(case)
    clock = h.Clock(T0)
    accts = {n: h.Acct(d7=START_7D[n], d7_reset=RESETS[n]) for n in (W, P, P2)}
    world = h.World(clock=clock, accts=accts, active=P2, tiers=cfg["tiers"], lines=dict(cfg["lines"]),
                    disabled=set(cfg.get("disabled", set())))
    rdir = h.SIM / "runs" / "week2" / f"{case}-{cname}"
    if rdir.exists():
        shutil.rmtree(rdir)
    rdir.mkdir(parents=True)
    sw = h.FakeSwitcher(rdir, world)
    events = []
    settings = AutoSwitchSettings(threshold=85.0, weekly_threshold=cfg["weekly"], interval_seconds=60.0,
                                  cooldown_seconds=300.0, hysteresis_pct=10.0, strategy=cfg["strategy"],
                                  include_api_key_accounts=False, unhealthy_ticks=3, model=None)
    eng = AutoSwitchEngine(sw, settings, events.append, dry_run=False,
                           state_path=rdir / "autoswitch_state.json", clock=clock)
    switches, samples, resets_log, line_log = [], [], [], []
    reasons = {}
    m = dict(pm_demand=0.0, pm_served=0.0, pm_blocked=0.0, pm_min=0, wm_unserved=0.0,
             starved=0, app7=0.0, app_unserved7=0.0, p_cc7=0.0, p_max7=0.0, chosen_p=0)
    work_by_pm, work_by_wm = {}, {}
    wm_demand = sum(daily[d] for d in daily
                    if MEAS0 <= datetime.fromisoformat(d + "T18:00+00:00").timestamp() and d < "2026-11-18")
    next_tick = T0
    minutes = int((END - T0) // 60) + 1  # +1: the END-minute processes work's reset
    for minute in range(minutes):
        t = T0 + minute * 60
        clock.now = t
        for n, a in accts.items():
            if a.h5_start is not None and t >= a.h5_start + 5 * h.H:
                a.h5, a.h5_start = 0.0, None
            if a.d7_reset is not None and t >= a.d7_reset:
                resets_log.append({"account": h.NAMES[n], "t": h.iso(a.d7_reset),
                                   "d7BeforeReset": round(a.d7, 2), "unusedPct": round(100 - a.d7, 2)})
                a.d7, a.d7_reset = 0.0, a.d7_reset + 7 * h.D
        if minute % 60 == 0:
            if cfg.get("work_schedule"):
                raw = 100 - 15 * workdays_left(t, accts[W].d7_reset)
                world.lines[W] = native_line(raw, 40, 95)
                line_log.append({"t": h.iso(t), "account": "work", "line": world.lines[W], "formula": round(raw, 1)})
            if cfg.get("personal_schedule"):
                raw = 100 - 4.5 * (accts[P].d7_reset - t) / h.D
                world.lines[P] = native_line(raw, 50, 95)
                line_log.append({"t": h.iso(t), "account": "personal", "line": world.lines[P], "formula": round(raw, 1)})
        if t >= next_tick:
            before = {h.NAMES[n]: h._windows(a) for n, a in accts.items()}
            start = len(events)
            outcome = eng.tick()
            th = eng._resolve_thresholds()
            for ev in events[start:]:
                e = ev.to_json()
                if not in_meas(t):
                    continue
                if e["event"] == "switch":
                    fr, to = str(e["from"]["number"]), str(e["to"]["number"])
                    under = {}
                    for o in (P2, W):
                        b = eng._binding(accts[o].usage(), eng.settings, th[o])
                        under[h.NAMES[o]] = (not b.over) and (h.account_headroom(accts[o].usage()) or 0) > 0
                    if to == P and any(under.values()):
                        m["chosen_p"] += 1
                    switches.append({"t": h.iso(t), "day": datetime.fromtimestamp(t, tz=timezone.utc).strftime("%a %m-%d"),
                                     "time": h.hhmm(t), "from": h.NAMES[fr], "to": h.NAMES[to],
                                     "trigger": e["trigger"], "fromWindows": before[h.NAMES[fr]],
                                     "toWindows": before[h.NAMES[to]], "underLinesAtSwitch": under,
                                     "lines": {h.NAMES[k]: th[k] for k in (W, P, P2)}})
                elif e["event"] in ("no-switch", "all-exhausted", "error"):
                    k = e.get("reason") or e["event"]
                    reasons[k] = reasons.get(k, 0) + 1
            events.clear()
            next_tick = t + eng._next_delay(outcome)
        if minute % 15 == 0 and in_meas(t):
            th = eng._resolve_thresholds()
            samples.append({"t": h.iso(t), "active": h.NAMES[world.active],
                            "perAccount": {h.NAMES[n]: h._windows(a) for n, a in accts.items()},
                            "lines": {h.NAMES[k]: th[k] for k in (W, P, P2)}})
        meas = in_meas(t)
        r7 = app_rate(t)
        if r7:
            a = accts[P]
            r5 = r7 * D7_RATIO
            f = max(0.0, min(1.0, (100 - a.h5) / r5, (100 - a.d7) / r7))
            if f > 0 and a.h5_start is None:
                a.h5_start = t
            a.h5, a.d7 = min(100.0, a.h5 + r5 * f), min(100.0, a.d7 + r7 * f)
            if meas:
                m["app7"] += r7 * f
                m["app_unserved7"] += r7 * (1 - f)
        wd, mins = wd_min(t)
        if wd < 5 and 540 <= mins < 1080:
            a = accts[W]
            if meas and (a.d7 >= 95 or a.h5 >= 95):
                m["starved"] += 1
            r7 = daily[datetime.fromtimestamp(t, tz=timezone.utc).strftime("%Y-%m-%d")] / 540
            r5 = r7 * D7_RATIO
            f = max(0.0, min(1.0, (100 - a.h5) / r5, (100 - a.d7) / r7))
            if f > 0 and a.h5_start is None:
                a.h5_start = t
            a.h5, a.d7 = min(100.0, a.h5 + r5 * f), min(100.0, a.d7 + r7 * f)
            if meas:
                m["wm_unserved"] += 1 - f
            work_by_wm[a.d7_reset] = work_by_wm.get(a.d7_reset, 0.0) + r7 * f
        base = personal_mac_demand(t)
        if base:
            n = world.active
            a = accts[n]
            r5 = base / UNITS[n]
            r7 = r5 / D7_RATIO
            f = max(0.0, min(1.0, (100 - a.h5) / r5, (100 - a.d7) / r7))
            if f > 0 and a.h5_start is None:
                a.h5_start = t
            a.h5, a.d7 = min(100.0, a.h5 + r5 * f), min(100.0, a.d7 + r7 * f)
            if n == W:
                work_by_pm[a.d7_reset] = work_by_pm.get(a.d7_reset, 0.0) + r7 * f
            if meas:
                m["pm_demand"] += base
                m["pm_served"] += base * f
                m["pm_blocked"] += 1 - f
                m["pm_min"] += 1
                if n == P:
                    m["p_cc7"] += r7 * f
        if meas:
            m["p_max7"] = max(m["p_max7"], accts[P].d7)

    stamps = [datetime.fromisoformat(s["t"].replace("Z", "+00:00")).timestamp() for s in switches]
    gaps = [(b - a) / 60 for a, b in zip(stamps, stamps[1:])]
    days = (END - MEAS0) / h.D
    p_total = m["p_cc7"] + m["app7"]
    work_cycles = [
        {"cycleEndsAt": h.iso(c), "byPersonalMac7dPts": round(work_by_pm.get(c, 0.0), 2),
         "byWorkMac7dPts": round(work_by_wm.get(c, 0.0), 2),
         "d7BeforeReset": next((r["d7BeforeReset"] for r in resets_log
                                if r["account"] == "work" and r["t"] == h.iso(c)), None)}
        for c in sorted(set(work_by_pm) | set(work_by_wm)) if MEAS0 < c <= END
    ]
    metrics = {
        "measurementWindow": [h.iso(MEAS0), h.iso(END)],
        "totalSwitches": len(switches), "switchesPerDay": round(len(switches) / days, 2),
        "minGapMinutes": round(min(gaps), 1) if gaps else None, "gapsUnder30Min": sum(g < 30 for g in gaps),
        "personalMacBlockedMinutes": round(m["pm_blocked"], 1), "personalMacDemandMinutes": m["pm_min"],
        "personalMacServedPct": round(100 * m["pm_served"] / m["pm_demand"], 2),
        "workMacStarvedMinutes": m["starved"],
        "workMacUnservedMinutes": round(m["wm_unserved"], 1),
        "workMacDemandPtsApprox": round(wm_demand, 1),
        "workCycles": work_cycles,
        "personal7d": {"claudeCode": round(m["p_cc7"], 2), "app": round(m["app7"], 2),
                       "claudeCodeSharePct": round(100 * m["p_cc7"] / p_total, 1) if p_total else None,
                       "appUnservedPts": round(m["app_unserved7"], 2), "max7d": round(m["p_max7"], 2)},
        "personalChosenWhileP2OrWorkUnderLines": m["chosen_p"],
        "noSwitchReasonCounts": reasons,
    }
    metrics["weeklyResets"] = [r for r in resets_log if datetime.fromisoformat(r["t"].replace("Z", "+00:00")).timestamp() > MEAS0]
    return {"config": cname, "case": case, "native": cfg["native"], "workMacDailyPct": daily,
            "metrics": metrics, "switches": switches, "samples": samples, "lineSchedule": line_log}


def main():
    arg = sys.argv[1]
    if arg != "merge":
        path = h.SIM / "results" / f"week2-{arg}.json"
        only = sys.argv[2:]
        runs = json.loads(path.read_text()) if only and path.exists() else {}
        for c in (only or CONFIGS):
            runs[c] = run(c, arg)
            mm = runs[c]["metrics"]
            print(arg, c, mm["totalSwitches"], mm["personalMacBlockedMinutes"], mm["workMacStarvedMinutes"], flush=True)
        runs = {c: runs[c] for c in CONFIGS if c in runs}
        path.write_text(json.dumps(runs, indent=1))
        return
    res_path = h.SIM / "results.json"
    res = json.loads(res_path.read_text())
    for block in res["byConfig"].values():
        tl = block["timelines"]
        if "week" in tl:
            tl["weekV1_allDayDemand"] = tl.pop("week")
    cases = {c: json.loads((h.SIM / "results" / f"week2-{c}.json").read_text()) for c in ("draw10to15", "flat15")}
    res["sharedWorkGoal"] = {
        "assumptions": {
            "window": "warm-up Mon 2026-11-02 09:00 (7d work 40, personal 30, personal2 10); metrics over "
                      "Wed 11-04 12:00 -> Wed 11-18 12:00 = two full work weeks",
            "resets": "work Wed 12:00, personal Thu 08:00, personal2 Sat 10:00",
            "personalMac": "heavy 1.1 5h-%/min on a Pro, 0.22 on work (Max 5x); 7d = 5h/6; "
                           "weekdays 19-24, weekend 10-13 & 16-20; starts on personal2",
            "workMac": "per working day 10..15 pts of work 7d (seed 20261102) or 15 flat, spread over 09-18, 5h at 6x",
            "app": "personal only, 30 pts 7d/week in 3 x 10-min bursts/day (08:00 12:30 17:30), 5h at 6x",
            "starved": "weekday 09-18 minutes with work 5h or 7d >= 95",
            "lineFloor": "per-account thresholds below 50 are rejected by `cswap threshold` and a hand-edited "
                         "one reads back as 'inherit global'; P2/P3 floors are 50, not 40",
            "polling": "every tick sees exact, fresh usage; engine ticks every 60 s on the fake clock",
        },
        "configs": {c: {k: ({h.NAMES[s]: x for s, x in v.items()} if k in ("tiers", "lines")
                            else sorted(h.NAMES[s] for s in v) if k == "disabled" else v)
                        for k, v in cfg.items()} for c, cfg in CONFIGS.items()},
        "aliases": {"B": "P0"},
        "cases": cases,
    }
    res_path.write_text(json.dumps(res, indent=1))


if __name__ == "__main__":
    main()
