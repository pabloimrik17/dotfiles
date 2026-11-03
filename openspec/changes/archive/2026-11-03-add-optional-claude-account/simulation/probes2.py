"""Probes for the manual-switch reclaim (3a) and personal's weekly protection (4)."""

import json
import sys
from dataclasses import replace
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import harness as h  # noqa: E402

root = h.SIM / "runs" / "probes2"
out = {}


def ts(y, mo, d, hh, mm=0):
    return datetime(y, mo, d, hh, mm, tzinfo=timezone.utc).timestamp()


def acct(h5, d7, d7_reset, h5_reset=None):
    a = h.Acct(h5=h5, d7=d7, d7_reset=d7_reset)
    a.h5_reset_override = h5_reset
    return a


def world_for(cname, t0, accts, active, *, extra_disabled=()):
    cfg = h.CONFIGS[cname]
    clock = h.Clock(t0)
    world = h.World(clock=clock, accts={h.SLOT[n]: a for n, a in accts.items()},
                    active=h.SLOT[active], tiers=cfg["tiers"], lines=cfg["lines"],
                    disabled={h.SLOT[n] for n in extra_disabled} | cfg.get("disabled", set()))
    return world, clock


def drive(run, world, clock, t0, plan, ticks):
    """Engine ticks every 60 s from t0; `plan` maps second offsets to manual switches
    (FakeSwitcher.switch_to, as `cswap switch` would: it never writes engine state)."""
    log = []
    events = sorted(plan.items())
    for i in range(ticks):
        t = t0 + 60 * i
        while events and t0 + events[0][0] <= t:
            off, target = events.pop(0)
            clock.now = t0 + off
            run.switcher.switch_to(h.SLOT[target])
            log.append(f"+{off:>4}s MANUAL switch -> {target}")
        clock.now = t
        outcome, evs = run.tick()
        s = h.summarize(outcome, evs)
        what = f"SWITCH -> {s['switch']} ({s['trigger']})" if "switch" in s else f"{s['outcome']}: {s['reason']}"
        log.append(f"+{60 * i:>4}s tick: active={h.NAMES[world.active]} {what}")
    return log


# Thursday 10:00: work already reset Wed 12:00, so personal2 (Sat) resets first.
THU = ts(2026, 11, 5, 10)
thu_accts = lambda: {  # noqa: E731
    "personal2": acct(30, 40, ts(2026, 11, 7, 10), THU + 2 * h.H),
    "work": acct(10, 20, ts(2026, 11, 11, 12), THU + 3 * h.H),
    "personal": acct(0, 30, ts(2026, 11, 12, 8)),
}
# Monday 10:00: work resets Wed, before personal2 (Sat).
MON = ts(2026, 11, 2, 10)
mon_accts = lambda: {  # noqa: E731
    "personal2": acct(30, 15, ts(2026, 11, 7, 10), MON + 4 * h.H),
    "work": acct(10, 40, ts(2026, 11, 4, 12), MON + 3 * h.H),
    "personal": acct(0, 30, ts(2026, 11, 5, 8)),
}

for c in ("B", "E", "F", "G"):
    # (i) engine has not switched recently; user goes to work at +30 s.
    w, clk = world_for(c, THU, thu_accts(), "personal2")
    r = h.Run(root, f"manual-quiet-{c}", w, h.CONFIGS[c]["strategy"])
    out[f"3a-quiet-THU-{c}"] = drive(r, w, clk, THU, {30: "work"}, 4)
    # (ii) engine itself moved work -> personal2 at +0; user goes back to work at +30 s.
    w, clk = world_for(c, THU, thu_accts(), "work")
    r = h.Run(root, f"manual-recent-{c}", w, h.CONFIGS[c]["strategy"])
    out[f"3a-recentEngineSwitch-THU-{c}"] = drive(r, w, clk, THU, {30: "work"}, 8)
# F and G on Monday: inside the top tier work resets first.
for c in ("F", "G"):
    w, clk = world_for(c, MON, mon_accts(), "personal2")
    r = h.Run(root, f"manual-mon-{c}", w, h.CONFIGS[c]["strategy"])
    out[f"3a-MON-{c}"] = drive(r, w, clk, MON, {390: "personal2"}, 9)

# (4) Can a per-account line protect personal's weekly window?
T = h.T0
four = lambda: {  # noqa: E731
    "personal2": acct(86, 50, T + 4 * h.D, T + 2 * h.H),  # active, over its 5h line
    "work": acct(40, 97, T + 2 * h.D, T + 2 * h.H),       # over the weekly line
    "personal": acct(10, 72, T + 6 * h.D, T + 2 * h.H),   # weekly at 72%
}
for strategy, tiers in (("best", {}), ("priority-consume-first",
                                       {h.SLOT["personal2"]: 100, h.SLOT["work"]: 100, h.SLOT["personal"]: 10})):
    for weekly in (95.0, None):
        clock = h.Clock(T)
        world = h.World(clock=clock, accts={h.SLOT[n]: a for n, a in four().items()},
                        active=h.SLOT["personal2"], tiers=tiers, lines={h.SLOT["personal"]: 70.0})
        run = h.Run(root, f"weekly-{strategy}-{weekly}", world, strategy)
        run.engine.settings = replace(run.engine.settings, weekly_threshold=weekly)
        b = h.bindings(run)
        outcome, evs = run.tick()
        out[f"4-{strategy}-weekly{weekly}-personalLine70"] = {
            "result": h.summarize(outcome, evs),
            "personalBinding": b["personal"], "workBinding": b["work"]}

(h.SIM / "results" / "probes2.json").write_text(json.dumps(out, indent=1))
for k, v in out.items():
    print(k)
    for row in (v if isinstance(v, list) else [v]):
        print("   ", row)
