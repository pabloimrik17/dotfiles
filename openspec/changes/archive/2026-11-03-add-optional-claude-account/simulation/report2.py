"""Summarize results/week2-*.json (shared-work goal sim)."""
import json, sys
from pathlib import Path
SIM = Path(__file__).resolve().parent
out = []
for case in ("draw10to15", "flat15"):
    runs = json.loads((SIM / f"results/week2-{case}.json").read_text())
    out.append(f"\n##### case {case}")
    out.append(f"{'cfg':14} {'sw/day':>6} {'minGap':>6} {'<30':>3} {'pmBlk':>6} {'pmSrv%':>6} {'starv':>5} {'wmUns':>5} | work cycles (pm pts / wm pts / 7d@reset) | p2 7d@reset | personal 7d@reset | personal CC/app max7d | pChosen")
    for c, r in runs.items():
        m = r["metrics"]
        wc = "; ".join(f"{x['byPersonalMac7dPts']:.0f}/{x['byWorkMac7dPts']:.0f}/{x['d7BeforeReset']}" for x in m["workCycles"])
        p2 = [x["d7BeforeReset"] for x in m["weeklyResets"] if x["account"] == "personal2"]
        pp = [x["d7BeforeReset"] for x in m["weeklyResets"] if x["account"] == "personal"]
        pc = m["personal7d"]
        out.append(f"{c:14} {m['switchesPerDay']:>6} {m['minGapMinutes']!s:>6} {m['gapsUnder30Min']:>3} {m['personalMacBlockedMinutes']:>6} {m['personalMacServedPct']:>6} {m['workMacStarvedMinutes']:>5} {m['workMacUnservedMinutes']:>5} | {wc} | {p2} | {pp} | {pc['claudeCode']:.0f}/{pc['app']:.0f} {pc['max7d']} | {m['personalChosenWhileP2OrWorkUnderLines']}")
    if "-v" in sys.argv:
        for c, r in runs.items():
            out.append(f"\n-- {case} {c}: {r['native']}  reasons={r['metrics']['noSwitchReasonCounts']}")
            for s in r["switches"]:
                L = s["lines"]
                out.append(f"   {s['day']} {s['time']} {s['from']}({s['fromWindows']['5h']}/{s['fromWindows']['7d']}) -> {s['to']}({s['toWindows']['5h']}/{s['toWindows']['7d']}) [{s['trigger']}] lines w{L['work']} p{L['personal']} p2{L['personal2']}")
text = "\n".join(out)
(SIM / "results/report-goal.txt").write_text(text + "\n")
print(text)
