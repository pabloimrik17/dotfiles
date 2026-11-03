"""Render results/*.json as text tables (results/report.txt)."""
import json
from pathlib import Path
SIM = Path(__file__).resolve().parent
snap = json.loads((SIM / "results/snapshots.json").read_text())
tl = json.loads((SIM / "results/timelines.json").read_text())
wk = json.loads((SIM / "results/weeks.json").read_text())
out = []
def p(*a): out.append(" ".join(str(x) for x in a))
errs = [(k, c) for tag in ("default", "reversed") for k, row in snap[tag].items()
        for c, r in row["configs"].items() for e in r["events"] if e["event"] == "error"]
errs += [(k, e) for k, r in tl["runs"].items() for e in r.get("events", []) if e["event"] == "error"]
errs += [(k, n) for k, r in wk["runs"].items() for n in r["metrics"]["noSwitchReasonCounts"] if n == "error"]
p("ERROR EVENTS:", len(errs), errs[:3])
for tag in ("default", "reversed"):
    p(f"\n=== SNAPSHOTS (7d resets {tag}) ===")
    for k, row in snap[tag].items():
        ins = "; ".join(f"{n} {u['five_hour']['pct']:g}/{u['seven_day']['pct']:g}" for n, u in row["inputs"].items())
        p(f"\n{k}: active={row['active']} disabled={row['disabled']} | {ins} | manualBest={row['manualBest']}")
        for c, r in row["configs"].items():
            s = f"SWITCH -> {r['switch']} ({r['trigger']})" if "switch" in r else f"{r['outcome']}: {r['reason']} ({r['detail']})"
            p(f"  {c}: {s}")
def timeline(k, r):
    m = r["metrics"]
    p(f"\n{k}: switches={m['totalSwitches']} perDay={m['switchesPerDay']} minGap={m['minGapMinutes']} gaps<30={m['gapsUnder30Min']}")
    p(f"   blockedMin={m['blockedMinutes']} demandMin={m['demandMinutes']} served%={m['demandServedPct']} overLineDemandMin={m['activeOverLineDemandMinutes']} servedShare={m['demandServedShareByAccountPct']}")
    p(f"   weeklyResets={[(w['account'], w['t'][5:16], w['unusedPct']) for w in m['weeklyResets']]}")
    p(f"   personal7d={m['personal7dConsumed']} personalChosenWhileOthersUnder={m['personalChosenWhileP2OrWorkUnderLines']}")
    for s in r["switches"]:
        p(f"   {s['day']} {s['time']} {s['from']}({s['fromWindows']['5h']}/{s['fromWindows']['7d']}) -> {s['to']}({s['toWindows']['5h']}/{s['toWindows']['7d']}) [{s['trigger']}] under={s['underLinesAtSwitch']}")
    p("   end:", "; ".join(f"{n} {v['5h']}/{v['7d']}" for n, v in m["end"].items()), "| reasons:", m["noSwitchReasonCounts"])
p("\n=== DAY TIMELINES ===")
for k, r in tl["runs"].items():
    timeline(k, r)
p("\n=== WEEK (calibrated) ===")
for k, r in wk["runs"].items():
    timeline(k, r)
text = "\n".join(out)
(SIM / "results/report.txt").write_text(text + "\n")
print(text)
