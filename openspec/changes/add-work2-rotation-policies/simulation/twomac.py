"""Two-Mac rotation sim: the personal Mac and the work Mac, each with its own
real 1.2.0 engine, over the four shared accounts.

  run.sh twomac.py calibrate                       work-Mac demand check (busiest 5h per day)
  run.sh twomac.py run [--shard i/n] [--profile P] [--lines 50,60] [--demands 2]
                       [--pm-idle] [--no-p2] [--no-status-quo] [--only ID,ID]
                                                   one JSON per run under results/runs/
  run.sh twomac.py merge                           fold results/runs/ into results.json
"""

from __future__ import annotations

import json
import statistics
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import harness as h  # noqa: E402

W, P, P2, W2 = h.SLOT["work"], h.SLOT["personal"], h.SLOT["personal2"], h.SLOT["work2"]
WORK = (W, W2)
PCF = "priority-consume-first"
STRATEGIES = ("best", "weekly-first", "consume-first", PCF)
WLINES = (95.0, 98.0)
LLINES = (60.0, 70.0, 80.0)
DEMANDS = (1.0, 1.5, 2.0)
STATUS_QUO = "off"


def at(y, mo, d, hh=0, mm=0) -> float:
    return datetime(y, mo, d, hh, mm, tzinfo=h.CET).timestamp()


T0 = at(2026, 11, 2)    # Mon 00:00 CET, warm-up from 7d = 0
M0 = at(2026, 11, 8)    # Sun 00:00 CET, after every account's first reset
END = at(2026, 11, 22)  # Sun 00:00 CET: two weeks, two resets of each account
FIRST_RESET = {
    W: at(2026, 11, 4, 12),    # Wed 12:00
    P: at(2026, 11, 6, 8),     # Fri 08:00
    W2: at(2026, 11, 7, 13),   # Sat 13:00
    P2: at(2026, 11, 7, 22),   # Sat 22:00
}

PRO_HEAVY, D7_RATIO = 1.1, 6.0
UNITS = {W: 5.0, W2: 5.0, P: 1.0, P2: 1.0}
APP_BURSTS = ((8, 0), (12, 30), (17, 30))
APP_7D = 30.0 / (7 * 3 * 10)
WM_PER_DAY = 16.0
WM_START, WM_END = 8 * 60, 20 * 60
# Mon..Fri volume factors: mean and median 1.0, so every 7-day window holds
# exactly 5 x 16 x demand points and the median day is 16 x demand.
PROFILES = {
    "peakTue": (1.0, 2.2, 0.4, 1.0, 0.4),
    "peakFri": (1.0, 0.4, 1.0, 0.4, 2.2),
    "flat": (1.0, 1.0, 1.0, 1.0, 1.0),
}
PM_TIERS = {P2: 100, W: 50, W2: 50, P: 10}
WM_TIERS = {W: 50, W2: 50}


def wd_min(t: float) -> tuple[int, int]:
    dt = h.local(t)
    return dt.weekday(), dt.hour * 60 + dt.minute


def pm_demand(t: float) -> float:
    wd, m = wd_min(t)
    if wd < 5:
        return PRO_HEAVY if m >= 19 * 60 else 0.0
    return PRO_HEAVY if (600 <= m < 780 or 960 <= m < 1200) else 0.0


def app_rate(t: float) -> float:
    _, m = wd_min(t)
    return APP_7D if any(hh * 60 + mm <= m < hh * 60 + mm + 10 for hh, mm in APP_BURSTS) else 0.0


def wm_rate7(t: float, mult: float, factors: tuple) -> float:
    wd, m = wd_min(t)
    if wd < 5 and WM_START <= m < WM_END:
        return WM_PER_DAY * mult * factors[wd] / (WM_END - WM_START)
    return 0.0


def run_id(s, wl, l, d, profile="peakTue", pm_on=True, p2_on=True) -> str:
    base = f"{s}-W{wl:g}-L{l:g}-x{d:g}" if s != STATUS_QUO else f"statusquo-L{l:g}-x{d:g}"
    base = base if profile == "peakTue" else f"{base}-{profile}"
    base = base if pm_on else f"{base}-pmIdle"
    return base if p2_on else f"{base}-noP2"


def all_runs(profile: str, llines=LLINES, demands=DEMANDS, pm_on=True, status_quo=True,
             p2_on=True) -> list[tuple]:
    runs = [(s, wl, l, d, profile, pm_on, p2_on)
            for s in STRATEGIES for wl in WLINES for l in llines for d in demands]
    if status_quo:
        runs += [(STATUS_QUO, None, 60.0, d, profile, pm_on, p2_on) for d in demands]
    return runs


def gaps_of(stamps: list[float]) -> list[float]:
    return [(b - a) / 60 for a, b in zip(stamps, stamps[1:])]


def run(s: str, wl: float | None, l: float, mult: float, profile: str = "peakTue",
        pm_on: bool = True, p2_on: bool = True) -> dict:
    rid = run_id(s, wl, l, mult, profile, pm_on, p2_on)
    factors = PROFILES[profile]
    clock = h.Clock(T0)
    accts = {n: h.Acct(d7_reset=FIRST_RESET[n]) for n in h.NAMES}
    pm = h.Mac("personal", slots=[W, P, P2, W2] if p2_on else [W, P, W2], active=P2 if p2_on else P,
               tiers=PM_TIERS, lines={P2: 95.0, W: l, W2: l, P: 80.0})
    wm = h.Mac("work", slots=[W, W2], active=W, tiers=WM_TIERS,
               lines={W: wl, W2: wl} if wl is not None else {})
    root = h.SIM / "runs" / rid
    drivers = {"personal": h.Driver(root / "personal", pm, accts, clock, PCF)}
    if s != STATUS_QUO:
        drivers["work"] = h.Driver(root / "work", wm, accts, clock, s)
    macs = {"personal": pm, "work": wm}

    switches = {"personal": [], "work": []}
    reasons = {"personal": {}, "work": {}}
    resets = []
    cycle = {n: {} for n in h.NAMES}  # account -> reset ts -> {"wm": pts, "pm": pts, "app": pts}
    samples = []
    episodes = []
    m = dict(wm_min=0, wm_atlimit=0, wm_wall=0, wm_unserved=0.0, wm_ge95=0, wm_stuck=0,
             pm_min=0, pm_unserved=0.0, pm_held=0, app_min=0, app_short=0, app_unserved=0.0)
    wm_served = {n: 0.0 for n in WORK}
    pm_spend = {n: 0.0 for n in h.NAMES}

    def add_cycle(n, who, pts):
        c = cycle[n].setdefault(accts[n].d7_reset, {"wm": 0.0, "pm": 0.0, "app": 0.0})
        c[who] += pts

    minutes = int((END - T0) // 60)
    for minute in range(minutes):
        t = T0 + minute * 60
        clock.now = t
        meas = M0 <= t < END
        for n, a in accts.items():
            if a.h5_start is not None and t >= a.h5_start + 5 * h.H:
                a.h5, a.h5_start = 0.0, None
            if t >= a.d7_reset:
                if M0 <= a.d7_reset < END:
                    c = cycle[n].get(a.d7_reset, {"wm": 0.0, "pm": 0.0, "app": 0.0})
                    resets.append({"account": h.NAMES[n], "at": h.cet(a.d7_reset),
                                   "d7BeforeReset": round(a.d7, 2), "unusedPct": round(100 - a.d7, 2),
                                   "byWorkMac": round(c["wm"], 2), "byPersonalMac": round(c["pm"], 2),
                                   "byApp": round(c["app"], 2)})
                a.d7, a.d7_reset = 0.0, a.d7_reset + 7 * h.D
        for name, drv in drivers.items():
            if not drv.due():
                continue
            mac = macs[name]
            before = {n: (round(accts[n].h5, 2), round(accts[n].d7, 2)) for n in mac.slots}
            outcome, events = drv.tick()
            if not meas:
                continue
            for e in events:
                kind = h.event_kind(e)
                if kind == "switch":
                    fr, to = str(e.from_ref["number"]), str(e.to_ref["number"])
                    line = mac.lines[to]
                    room = min(line - before[to][0], line - before[to][1])
                    switches[name].append({
                        "t": t, "at": h.cet(t), "from": h.NAMES[fr], "to": h.NAMES[to],
                        "trigger": e.trigger, "fromWin": before[fr], "toWin": before[to],
                        "toLine": line, "landingRoom": round(room, 2), "landedOverLine": room <= 0,
                    })
                elif kind:
                    reasons[name][kind] = reasons[name].get(kind, 0) + 1

        r7 = app_rate(t)
        if r7:
            f = accts[P].consume(t, r7 * D7_RATIO, r7)
            add_cycle(P, "app", r7 * f)
            if meas:
                m["app_min"] += 1
                m["app_short"] += f < 1.0
                m["app_unserved"] += r7 * (1 - f)

        r7 = wm_rate7(t, mult, factors)
        if r7:
            n = wm.active
            a = accts[n]
            if meas:
                others_ok = s != STATUS_QUO and any(
                    accts[o].below(wm.lines[o]) for o in wm.slots if o != n)
                m["wm_min"] += 1
                m["wm_ge95"] += a.binding() >= 95.0
                if a.exhausted():
                    m["wm_atlimit"] += 1
                    m["wm_wall"] += not others_ok
                    ep = episodes[-1] if episodes else None
                    if ep and ep["lastT"] == t - 60:
                        ep["minutes"] += 1
                        ep["wallMinutes"] += not others_ok
                        ep["lastT"] = t
                    else:
                        episodes.append({
                            "start": h.cet(t), "lastT": t, "minutes": 1, "wallMinutes": int(not others_ok),
                            "workMacActive": h.NAMES[n], "personalMacActive": h.NAMES[pm.active],
                            **{h.NAMES[o]: [round(accts[o].h5, 1), round(accts[o].d7, 1)] for o in WORK}})
                if s != STATUS_QUO and not a.below(wm.lines[n]) and others_ok:
                    m["wm_stuck"] += 1
            f = a.consume(t, r7 * D7_RATIO, r7)
            add_cycle(n, "wm", r7 * f)
            if meas:
                m["wm_unserved"] += 1 - f
                wm_served[n] += r7 * f

        base = pm_demand(t) if pm_on else 0.0
        if base:
            n = pm.active
            a = accts[n]
            if meas:
                m["pm_min"] += 1
                if not a.below(pm.lines[n]) and any(
                        accts[o].below(pm.lines[o]) for o in pm.slots if o != n):
                    m["pm_held"] += 1
            r5 = base / UNITS[n]
            f = a.consume(t, r5, r5 / D7_RATIO)
            add_cycle(n, "pm", r5 / D7_RATIO * f)
            if meas:
                m["pm_unserved"] += 1 - f
                pm_spend[n] += r5 / D7_RATIO * f

        if meas and minute % 30 == 0:
            samples.append({"at": h.cet(t), "pm": h.NAMES[pm.active], "wm": h.NAMES[wm.active],
                            **{h.NAMES[n]: [round(a.h5, 1), round(a.d7, 1)] for n, a in accts.items()}})

    weeks = (END - M0) / (7 * h.D)

    def mac_switch_metrics(sw: list[dict]) -> dict:
        stamps = [x["t"] for x in sw]
        gaps = gaps_of(stamps)
        for x, nxt in zip(sw, sw[1:] + [None]):
            x["dwellMin"] = round((nxt["t"] - x["t"]) / 60, 1) if nxt else None
        pingpong = sum(1 for a, b in zip(sw, sw[1:])
                       if a["to"] == b["from"] and b["to"] == a["from"] and (b["t"] - a["t"]) < 30 * 60)
        triggers = {}
        for x in sw:
            triggers[x["trigger"]] = triggers.get(x["trigger"], 0) + 1
        return {
            "switches": len(sw), "triggers": triggers,
            "gapsUnder10Min": sum(g < 10 for g in gaps), "gapsUnder15Min": sum(g < 15 for g in gaps),
            "minGapMin": round(min(gaps), 1) if gaps else None,
            "pingPongUnder30Min": pingpong,
            "landedOverLine": sum(x["landedOverLine"] for x in sw),
            "nearLineLandings": sum(1 for x in sw if 0 < x["landingRoom"] < 3),
            "shortDwellUnder15Min": sum(1 for x in sw if x["dwellMin"] is not None and x["dwellMin"] < 15),
        }

    p2_resets = [r["d7BeforeReset"] for r in resets if r["account"] == "personal2"]
    metrics = {
        "workMac": {
            "demandMin": m["wm_min"],
            "wallMin": m["wm_wall"],
            "atLimitMin": m["wm_atlimit"],
            "unservedMin": round(m["wm_unserved"], 1),
            "ge95Min": m["wm_ge95"],
            "overLineWhileOtherBelowMin": m["wm_stuck"],
            "atLimitEpisodes": [{k: v for k, v in e.items() if k != "lastT"} for e in episodes],
            "servedPtsPerWeek": {h.NAMES[n]: round(v / weeks, 2) for n, v in wm_served.items()},
            **mac_switch_metrics(switches["work"]),
            "noSwitchReasons": reasons["work"],
        },
        "personalMac": {
            "demandMin": m["pm_min"],
            "unservedMin": round(m["pm_unserved"], 1),
            "wallsPct": round(100 * m["pm_unserved"] / m["pm_min"], 2) if m["pm_min"] else None,
            "overLineWhileAnotherBelowMin": m["pm_held"],
            "spendPtsPerWeek": {h.NAMES[n]: round(v / weeks, 2) for n, v in pm_spend.items()},
            "workSurplusPtsPerWeek": round(sum(pm_spend[n] for n in WORK) / weeks, 2),
            **mac_switch_metrics(switches["personal"]),
            "noSwitchReasons": reasons["personal"],
        },
        "personal2AtReset": p2_resets,
        "app": {"demandMin": m["app_min"], "shortfallMin": m["app_short"],
                "unservedPts": round(m["app_unserved"], 2)},
        "workUnusedAtReset": {h.NAMES[n]: [r["unusedPct"] for r in resets if r["account"] == h.NAMES[n]]
                              for n in WORK},
        "resets": resets,
    }
    for sw in switches.values():
        for x in sw:
            x.pop("t")
    return {"id": rid, "params": {"workStrategy": s, "workLine": wl, "personalWorkLine": l,
                                   "demand": mult, "profile": profile,
                                   "personalMacDemand": "ceiling" if pm_on else "idle",
                                   **({} if p2_on else {"personal2": "absent"})},
            "metrics": metrics, "switches": switches, "samples": samples}


def calibrate() -> dict:
    """Busiest 5h window per working day of the work-Mac demand alone, on one
    account with no cap, under the same window mechanics as the sim."""
    out = {}
    for profile, factors in PROFILES.items():
        for mult in DEMANDS:
            per_day = []
            t, h5, start, best, day = T0, 0.0, None, 0.0, None
            while t < END:
                d = h.local(t).date()
                if d != day:
                    if day is not None and day.weekday() < 5:
                        per_day.append(round(best, 1))
                    day, best = d, 0.0
                if start is not None and t >= start + 5 * h.H:
                    h5, start = 0.0, None
                r7 = wm_rate7(t, mult, factors)
                if r7:
                    if start is None:
                        start = t
                    h5 += r7 * D7_RATIO
                    best = max(best, h5)
                t += 60
            meas = per_day[5:]  # drop the warm-up week
            out[f"{profile}-x{mult:g}"] = {"busiest5hPerDay": meas, "median": statistics.median(meas),
                                           "max": max(meas)}
    return out


def main() -> None:
    args = sys.argv[1:]
    cmd = args[0] if args else "run"
    outdir = h.SIM / "results" / "runs"
    if cmd == "calibrate":
        cal = calibrate()
        (h.SIM / "results").mkdir(exist_ok=True)
        (h.SIM / "results" / "calibration.json").write_text(json.dumps(cal, indent=1))
        for k, v in cal.items():
            print(k, "median", v["median"], "max", v["max"], v["busiest5hPerDay"])
        return
    if cmd == "run":
        shard, nshards, profile, only = 0, 1, "peakTue", None
        llines, demands, pm_on, status_quo, p2_on = LLINES, DEMANDS, True, True, True
        i = 1
        while i < len(args):
            if args[i] == "--shard":
                shard, nshards = map(int, args[i + 1].split("/"))
                i += 2
            elif args[i] == "--profile":
                profile = args[i + 1]
                i += 2
            elif args[i] == "--lines":
                llines = tuple(float(x) for x in args[i + 1].split(","))
                i += 2
            elif args[i] == "--demands":
                demands = tuple(float(x) for x in args[i + 1].split(","))
                i += 2
            elif args[i] == "--pm-idle":
                pm_on = False
                i += 1
            elif args[i] == "--no-p2":
                p2_on = False
                i += 1
            elif args[i] == "--no-status-quo":
                status_quo = False
                i += 1
            elif args[i] == "--only":
                only = set(args[i + 1].split(","))
                i += 2
            else:
                sys.exit(f"unknown argument {args[i]}")
        outdir.mkdir(parents=True, exist_ok=True)
        todo = [r for r in all_runs(profile, llines, demands, pm_on, status_quo, p2_on)
                if only is None or run_id(*r) in only]
        for k, spec in enumerate(todo):
            if k % nshards != shard:
                continue
            res = run(*spec)
            (outdir / f"{res['id']}.json").write_text(json.dumps(res))
            wmx, pmx = res["metrics"]["workMac"], res["metrics"]["personalMac"]
            print(res["id"], "wmWall", wmx["wallMin"], "wmAtLimit", wmx["atLimitMin"],
                  "pmWalls%", pmx["wallsPct"], "surplus", pmx["workSurplusPtsPerWeek"],
                  "p2", res["metrics"]["personal2AtReset"], "sw", wmx["switches"], pmx["switches"],
                  flush=True)
        return
    if cmd == "merge":
        runs = {}
        for p in sorted(outdir.glob("*.json")):
            r = json.loads(p.read_text())
            r.pop("samples")
            p = r["params"]
            main_run = (p["profile"] == "peakTue" and p.get("personalMacDemand") == "ceiling"
                        and p.get("personal2", "usable") == "usable" and p["personalWorkLine"] in LLINES)
            sw = r.pop("switches")
            if main_run:
                r["switches"] = {
                    mac: [f"{x['at']} {x['from']}->{x['to']} {x['trigger']} 5h/7d "
                          f"{x['fromWin'][0]:g}/{x['fromWin'][1]:g} -> {x['toWin'][0]:g}/{x['toWin'][1]:g} "
                          f"room {x['landingRoom']:g} dwell {x['dwellMin']}" for x in xs]
                    for mac, xs in sw.items()}
            runs[r["id"]] = r
        cal_path = h.SIM / "results" / "calibration.json"
        res = {
            "meta": {**h.meta(), "t0": h.cet(T0), "measureFrom": h.cet(M0), "measureTo": h.cet(END)},
            "assumptions": ASSUMPTIONS,
            "calibration": json.loads(cal_path.read_text()) if cal_path.exists() else None,
            "runs": runs,
        }
        (h.SIM / "results.json").write_text(json.dumps(res, indent=1))
        print(f"merged {len(runs)} runs")
        return
    sys.exit(f"unknown command {cmd}")


ASSUMPTIONS = {
    "engines": "two real 1.2.0 AutoSwitchEngine instances, one per Mac, each with its own fake switcher, "
               "sequence, tiers, lines and state file; usage is account-wide and shared",
    "settings": "threshold 85 (scale only: every account has its own line), weeklyThreshold unset, "
                "intervalSeconds 60, cooldownSeconds 300, hysteresisPct 10, unhealthyTicks 3, no model, "
                "API-key accounts excluded; ticks every 60 s 24/7 (jitter pinned), perfect polling",
    "personalMac": "priority-consume-first; tiers/lines personal2 100/95, work 50/L, work2 50/L, personal 10/80; "
                   "demand weekdays 19-24 CET, weekends 10-13 & 16-20, all heavy (ceiling); starts on personal2",
    "workMac": "work + work2 only, lines W on both, tier 50 on both; demand weekdays 08-20 CET uniform within the "
               "day; day volume 16 x demand x factor (Mon..Fri) with mean and median factor 1.0; starts on work. "
               "Status quo: no engine, stays on work",
    "rates": "Pro heavy 1.1 5h-%/min, Max 5x 0.22; 7d = 5h/6; work-Mac 5h = 6 x its 7d rate",
    "app": "personal only, 30 pts 7d/week, 3 x 10-min bursts/day at 08:00 12:30 17:30 CET, 5h at 6x",
    "window": "warm-up Mon 11-02 00:00 CET with every 7d at 0; metrics over Sun 11-08 00:00 -> Sun 11-22 00:00 "
              "CET, which holds two resets of every account, each closing a fully simulated week",
    "resets": "weekly, CET: work Wed 12:00, personal Fri 08:00, work2 Sat 13:00, personal2 Sat 22:00; "
              "5h window opens at first use and closes 5 h later",
    "wall": "work Mac: demand minute with its active exhausted (5h or 7d at 100) and no other work account below "
            "W on both windows; status quo: any exhausted demand minute. personal Mac: unserved fraction of its "
            "demand minutes (D3)",
}


if __name__ == "__main__":
    main()
