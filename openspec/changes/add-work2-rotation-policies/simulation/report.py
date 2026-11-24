"""Tables and the selection rule over results.json; writes summary[-profile].txt.

  run.sh report.py [peakTue|peakFri|flat]
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

SIM = Path(__file__).resolve().parent
STRATEGIES = ("best", "weekly-first", "consume-first", "priority-consume-first")
SHORT = {"best": "best", "weekly-first": "wkfirst", "consume-first": "consume",
         "priority-consume-first": "pcf", "off": "off"}
WLINES = (95.0, 98.0)
RULE_LINES = (60.0, 70.0, 80.0)
DEMANDS = (1.0, 1.5, 2.0)


def load(profile: str, pm: str = "ceiling") -> dict:
    runs = json.loads((SIM / "results.json").read_text())["runs"]
    out = {}
    for r in runs.values():
        p = r["params"]
        if p["profile"] != profile or p.get("personalMacDemand", "ceiling") != pm:
            continue
        out[(p["workStrategy"], p["workLine"], p["personalWorkLine"], p["demand"])] = r["metrics"]
    return out


def fmt_row(key, m) -> str:
    s, w, l, d = key
    wm, pm = m["workMac"], m["personalMac"]
    p2 = "/".join(f"{x:.0f}" for x in m["personal2AtReset"])
    un = m["workUnusedAtReset"]
    unused = " ".join(f"{a}:{'/'.join(f'{x:.0f}' for x in v)}" for a, v in (("w", un["work"]), ("w2", un["work2"])))
    pmw = "-" if pm["wallsPct"] is None else f"{pm['wallsPct']:.2f}"
    return (f"{SHORT[s]:8} {('-' if w is None else f'{w:g}'):>3} {l:>3g} x{d:<3g} "
            f"{wm['wallMin']:>5} {wm['atLimitMin']:>5} {wm['unservedMin']:>6.0f} {wm['ge95Min']:>5} "
            f"{pmw:>6} {pm['workSurplusPtsPerWeek']:>6.1f} {p2:>7} {m['app']['shortfallMin']:>4} "
            f"{wm['switches']:>3}/{pm['switches']:<3} {wm['gapsUnder10Min']}/{wm['gapsUnder15Min']}       "
            f"{pm['gapsUnder10Min']}/{pm['gapsUnder15Min']}       {unused}")


HEADER = ("S        W   L   D     wall  @100 unserv  >=95   pmW%  surp/wk  p2@rst appS  sw wm/pm "
          "wm<10/<15 pm<10/<15 unused%@reset")


def wall_matrix(res: dict, llines, label: str) -> list[str]:
    out = [label, f"{'S':8} {'W':>3}  " + "  ".join(f"L{l:g}".ljust(13) for l in llines)]
    for s in STRATEGIES:
        for w in WLINES:
            cells = []
            for l in llines:
                cells.append("/".join(str(res[(s, w, l, d)]["workMac"]["wallMin"]) if (s, w, l, d) in res
                                      else "-" for d in DEMANDS).ljust(13))
            out.append(f"{SHORT[s]:8} {w:>3g}  " + "  ".join(cells))
    sq = [res.get(("off", None, 60.0, d)) for d in DEMANDS]
    if all(sq):
        out.append(f"{'off':8} {'-':>3}  L60 " + "/".join(str(m["workMac"]["wallMin"]) for m in sq)
                   + "  (status quo: work Mac on work only)")
    return out


def wall_free(res, s, w, l, demands) -> bool:
    return all(res.get((s, w, l, d), {}).get("workMac", {}).get("wallMin", 1) == 0 for d in demands)


def selection(res: dict, demands: tuple, label: str) -> list[str]:
    out = [label]
    ranked = []
    for s in STRATEGIES:
        for w in WLINES:
            passing = [l for l in RULE_LINES if wall_free(res, s, w, l, demands)]
            if not passing:
                out.append(f"  {SHORT[s]} W{w:g}: no L in 60/70/80 is wall-free at x"
                           + "/x".join(f"{d:g}" for d in demands))
                continue
            l = max(passing)
            ms = [res[(s, w, l, d)] for d in DEMANDS if (s, w, l, d) in res]
            p2ok = all(x > 85 for m in ms for x in m["personal2AtReset"])
            app_ok = all(m["app"]["shortfallMin"] == 0 for m in ms)
            g10 = sum(m["workMac"]["gapsUnder10Min"] + m["personalMac"]["gapsUnder10Min"] for m in ms)
            g15 = sum(m["workMac"]["gapsUnder15Min"] + m["personalMac"]["gapsUnder15Min"] for m in ms)
            surplus = [m["personalMac"]["workSurplusPtsPerWeek"] for m in ms]
            ranked.append(((-l, not p2ok, not app_ok, g15), s, w, l))
            out.append(f"  {SHORT[s]} W{w:g}: highest L {l:g}; p2>85 {p2ok}; no app shortfall {app_ok}; "
                       f"switch gaps <10 {g10}, <15 {g15} (all demands, both Macs); surplus/wk x1/x1.5/x2 "
                       + "/".join(f"{x:.1f}" for x in surplus))
    ranked.sort()
    if ranked:
        out.append("  ranked: " + ", ".join(f"{SHORT[s]} W{w:g} L{l:g}" for _, s, w, l in ranked))
    return out


def dilemma(res: dict) -> list[str]:
    out = ["x2 trade-off: surplus/wk and x2 work-Mac walls per L, for (S, W) wall-free at x1 and x1.5"]
    for s in STRATEGIES:
        for w in WLINES:
            ls = [l for l in sorted({k[2] for k in res if k[0] == s and k[1] == w})
                  if wall_free(res, s, w, l, (1.0, 1.5))]
            if not ls:
                continue
            cells = []
            for l in ls:
                m2 = res[(s, w, l, 2.0)]["workMac"]
                sur = [res[(s, w, l, d)]["personalMac"]["workSurplusPtsPerWeek"] for d in DEMANDS]
                cells.append(f"L{l:g}: x2 wall {m2['wallMin']} (unserved {m2['unservedMin']:.0f}), surplus "
                             + "/".join(f"{x:.1f}" for x in sur))
            out.append(f"  {SHORT[s]} W{w:g}: " + "; ".join(cells))
    return out


def main() -> None:
    profile = sys.argv[1] if len(sys.argv) > 1 else "peakTue"
    res = load(profile)
    llines = sorted({k[2] for k in res if k[0] != "off"})
    lines = [f"profile {profile} (work-Mac day factors), personal Mac at ceiling demand", ""]
    lines += wall_matrix(res, llines, "Work-Mac wall minutes at x1/x1.5/x2 "
                                      "(active exhausted and no other work account below W)")
    lines.append("")
    lines.append("Every run")
    lines.append(HEADER)
    for s in STRATEGIES + ("off",):
        for w in (WLINES if s != "off" else (None,)):
            for l in llines:
                for d in DEMANDS:
                    if (s, w, l, d) in res:
                        lines.append(fmt_row((s, w, l, d), res[(s, w, l, d)]))
    lines.append("")
    lines += selection(res, DEMANDS, "Selection rule (criterion 1 at x1, x1.5 and x2)")
    lines.append("")
    lines += selection(res, (1.0, 1.5), "Selection rule with criterion 1 relaxed to x1 and x1.5")
    lines.append("")
    lines += dilemma(res)
    idle = load(profile, "idle")
    if idle:
        lines.append("")
        lines.append("Work Mac alone (personal Mac idle, app load kept), x2")
        for k in sorted(idle, key=lambda k: (STRATEGIES.index(k[0]), k[1])):
            wm = idle[k]["workMac"]
            un = idle[k]["workUnusedAtReset"]
            lines.append(f"  {SHORT[k[0]]:8} W{k[1]:g}: wall {wm['wallMin']} at-limit {wm['atLimitMin']} "
                         f"unserved {wm['unservedMin']:.0f} >=95 {wm['ge95Min']} switches {wm['switches']} "
                         f"unused w {un['work']} w2 {un['work2']}")
    text = "\n".join(lines)
    suffix = "" if profile == "peakTue" else f"-{profile}"
    (SIM / f"summary{suffix}.txt").write_text(text + "\n")
    print(text)


if __name__ == "__main__":
    main()
