import json, re, sys
from datetime import datetime
if len(sys.argv) != 3:
    sys.exit('usage: log-weekly-stats.py <claude-swap.log> <cswap list --json output>')
LOG, ACCOUNTS = sys.argv[1], sys.argv[2]
use = re.compile(r'^(\S+ \S+),\d+ - INFO - usage (\S+): 5h ([\d.]+)%.*?7d ([\d.]+)% \(resets ([^)]+)\)')
sw = re.compile(r'^(\S+ \S+),\d+ - INFO - Switched from account (\d+) to (\d+)')
accounts = json.load(open(ACCOUNTS, encoding='utf-8'))['accounts']
num = {str(a['number']): a['alias'] for a in accounts}
alias_of = {a['email']: a['alias'] for a in accounts}
rows, active = [], None
for line in open(LOG, encoding='utf-8', errors='replace'):
    m = sw.match(line)
    if m:
        active = num.get(m.group(3)); continue
    m = use.match(line)
    if m and m.group(2) in alias_of:
        t = datetime.strptime(m.group(1), '%Y-%m-%d %H:%M:%S')
        rows.append((t, alias_of[m.group(2)], float(m.group(3)), float(m.group(4)), active))
# 7d value just before each drop (weekly reset) per account
for a in num.values():
    print(f'== {a}: 7d just before each weekly reset')
    prev = None
    for r in rows:
        if r[1] != a: continue
        if prev and r[3] < prev[3] - 5:
            print(f'  reset between {prev[0]:%a %m-%d %H:%M} ({prev[3]:.0f}%) and {r[0]:%a %m-%d %H:%M} ({r[3]:.0f}%)')
        prev = r
# work 7d increments while this Mac had personal active (=> consumed elsewhere: work Mac / claude.ai)
print('== work 7d increments while this Mac was on personal (work consumed elsewhere)')
prev, tot = None, {}
for r in rows:
    if r[1] != 'work': continue
    if prev and r[4] == 'personal' and prev[4] == 'personal' and r[3] >= prev[3]:
        wk = prev[0].strftime('%G-W%V')
        tot[wk] = tot.get(wk, 0) + (r[3] - prev[3])
    prev = r
for k, v in sorted(tot.items()): print(f'  {k}: +{v:.0f} pts')
print('== work: first reading >=95% 7d per week, and which account this Mac had active then')
seen = set()
for r in rows:
    if r[1] != 'work' or r[3] < 95: continue
    wk = r[0].strftime('%G-W%V')
    if wk in seen: continue
    seen.add(wk)
    print(f'  {wk}: {r[0]:%a %m-%d %H:%M} 7d {r[3]:.0f}% (this Mac active: {r[4]})')
print('== work 7d increments while this Mac was on work (both Macs mixed)')
prev, tot = None, {}
for r in rows:
    if r[1] != 'work': continue
    if prev and r[4] == 'work' and prev[4] == 'work' and r[3] >= prev[3]:
        wk = prev[0].strftime('%G-W%V')
        tot[wk] = tot.get(wk, 0) + (r[3] - prev[3])
    prev = r
for k, v in sorted(tot.items()): print(f'  {k}: +{v:.0f} pts')
