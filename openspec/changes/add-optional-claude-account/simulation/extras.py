"""Targeted follow-up probes through the same real engine (see harness.py)."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import harness as h  # noqa: E402
from claude_swap.lines import window_line, line_headroom, binding_window  # noqa: E402

root = h.SIM / "runs" / "extras"
out = {}


def burn_until_switch(name, cname, accts, active, rate=1.2, minutes=30, disabled=()):
    cfg = h.CONFIGS[cname]
    clock = h.Clock(h.T0)
    world = h.World(clock=clock, accts={h.SLOT[n]: a for n, a in accts.items()},
                    active=h.SLOT[active], tiers=cfg["tiers"], lines=cfg["lines"],
                    disabled={h.SLOT[n] for n in disabled})
    run = h.Run(root, f"{name}-{cname}", world, cfg["strategy"])
    log = []
    for m in range(minutes):
        clock.now = h.T0 + m * 60
        snap = {h.NAMES[n]: round(a.h5, 1) for n, a in world.accts.items()}
        outcome, events = run.tick()
        s = h.summarize(outcome, events)
        act = world.accts[world.active]
        log.append({"min": m, "active": h.NAMES[world.active], "5h": snap,
                    "activeBlocked": act.h5 >= 100 or act.d7 >= 100,
                    "d7": {h.NAMES[n]: round(a.d7, 2) for n, a in world.accts.items()}, **s})
        a = world.accts[world.active]
        if a.h5 < 100 and a.d7 < 100:
            a.h5 = min(100.0, a.h5 + rate)
            a.d7 = min(100.0, a.d7 + rate / 10)
    return log


def compact(log):
    rows, last = [], None
    for r in log:
        key = (r.get("switch"), r.get("reason"), r["activeBlocked"])
        if r.get("switch") or key != last:
            rows.append(f"m{r['min']:02d} active={r['active']}{' BLOCKED' if r['activeBlocked'] else ''} 5h={r['5h']} 7d={r['d7']} -> {r.get('switch') and 'SWITCH '+r['switch']+' ('+r['trigger']+')' or r.get('reason')}")
        last = key
    return rows


R = h.RESETS_DEFAULT
# (a) S6 under A and C: where does best finally leave personal?
for c in ("A", "C"):
    out[f"S6-burn-{c}"] = compact(burn_until_switch(
        "S6burn", c,
        {"personal": h.mk(86, 30, "personal", R), "work": h.mk(5, 91, "work", R),
         "personal2": h.mk(0, 50, "personal2", R)},
        "personal", disabled=("personal2",)))

# (b) S8 burned to the hard limit under every config.
for c in h.CONFIGS:
    out[f"S8-burn-{c}"] = compact(burn_until_switch(
        "S8burn", c,
        {"personal2": h.mk(97, 50, "personal2", R), "work": h.mk(40, 97, "work", R),
         "personal": h.mk(90, 30, "personal", R)},
        "personal2", minutes=40))

# (c) Priority reclaim of a barely-usable higher tier, then cooldown.
for c in ("B", "E"):
    p2 = 84 if c == "B" else 91
    out[f"reclaim-{c}"] = compact(burn_until_switch(
        "reclaim", c,
        {"work": h.mk(30, 60, "work", R), "personal2": h.mk(p2, 50, "personal2", R),
         "personal": h.mk(0, 30, "personal", R)},
        "work", minutes=12))

# (d) Line arithmetic straight from lines.py.
out["window_line"] = {
    "perAccount92_weekly95": {lbl: window_line(lbl, 92, 95) for lbl in ("5h", "7d", "Fable")},
    "perAccount92_weeklyNone": {lbl: window_line(lbl, 92, None) for lbl in ("5h", "7d", "Fable")},
}
out["line_headroom_5h_at_46pct_scale85"] = {
    str(line): round(line_headroom(46, line, 85), 2) for line in (92, 85, 75)}
out["line_headroom_7d_scale85_line95"] = {
    str(p): round(line_headroom(p, 95, 85), 2) for p in (10, 30, 50, 60, 70, 85, 91, 96)}

(h.SIM / "results" / "extras.json").write_text(json.dumps(out, indent=1))
for k, v in out.items():
    print(k)
    if isinstance(v, list):
        for row in v:
            print("   ", row)
    else:
        print("   ", v)
