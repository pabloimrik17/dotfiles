import json, re, sys
from datetime import datetime
if len(sys.argv) != 3:
    sys.exit('usage: log-weekly-stats.py <claude-swap.log> <cswap list --json output>')
LOG, ACCOUNTS = sys.argv[1], sys.argv[2]
WORK = ('work', 'work2')
use = re.compile(r'^(\S+ \S+),\d+ - INFO - usage (\S+): 5h ([\d.]+)%.*?7d ([\d.]+)% \(resets ([^)]+)\)')
sw = re.compile(r'^(\S+ \S+),\d+ - INFO - Switched from account (\d+) to (\d+)')
accounts = json.load(open(ACCOUNTS, encoding='utf-8'))['accounts']
label = {a['email']: a.get('alias') or f"account {a['number']}" for a in accounts}
num = {str(a['number']): label[a['email']] for a in accounts}
rows, active = [], None
for line in open(LOG, encoding='utf-8', errors='replace'):
    m = sw.match(line)
    if m:
        active = num.get(m.group(3)); continue
    m = use.match(line)
    if m and m.group(2) in label:
        t = datetime.strptime(m.group(1), '%Y-%m-%d %H:%M:%S')
        rows.append((t, label[m.group(2)], float(m.group(3)), float(m.group(4)), active, m.group(5)))


def cycles(acct):
    """Readings of one account split at each weekly reset (a 7d drop of more than 5)."""
    out, cur, prev = [], [], None
    for r in rows:
        if r[1] != acct: continue
        if prev and r[3] < prev[3] - 5:
            out.append(cur); cur = []
        cur.append(r); prev = r
    if cur: out.append(cur)
    return out


def named(acct):
    """Each cycle with a label: the day its reset was first seen, or its pending reset."""
    cs = cycles(acct)
    return [(f'week to {nxt[0][0]:%a %m-%d}' if nxt else f'current week (resets {c[-1][5]})', c)
            for c, nxt in zip(cs, cs[1:] + [None])]


for a in num.values():
    print(f'== {a}: 7d just before each weekly reset')
    for c, nxt in zip(cycles(a), cycles(a)[1:]):
        print(f'  reset between {c[-1][0]:%a %m-%d %H:%M} ({c[-1][3]:.0f}%) and {nxt[0][0]:%a %m-%d %H:%M} ({nxt[0][3]:.0f}%)')
for a in WORK:
    if a not in num.values(): continue
    cs = named(a)
    print(f'== {a} 7d increments while this Mac was on another account (consumed elsewhere: work Mac / claude.ai)')
    for n, c in cs:
        tot = sum(r[3] - p[3] for p, r in zip(c, c[1:])
                  if None not in (p[4], r[4]) and p[4] != a and r[4] != a and r[3] >= p[3])
        print(f'  {n}: +{tot:.0f} pts')
    print(f'== {a} 7d increments while this Mac was on {a} (both Macs mixed)')
    for n, c in cs:
        tot = sum(r[3] - p[3] for p, r in zip(c, c[1:]) if p[4] == a and r[4] == a and r[3] >= p[3])
        print(f'  {n}: +{tot:.0f} pts')
    print(f'== {a}: first reading >=95% 7d per week, and which account this Mac had active then')
    for n, c in cs:
        hit = next((r for r in c if r[3] >= 95), None)
        if hit:
            print(f'  {n}: {hit[0]:%a %m-%d %H:%M} 7d {hit[3]:.0f}% (this Mac active: {hit[4]})')
print('== both work accounts: 7d at each reset, unused = 100 - 7d')
for a in WORK:
    if a not in num.values(): continue
    for n, c in named(a)[:-1]:
        print(f'  {a} {n}: 7d {c[-1][3]:.0f}% unused {100 - c[-1][3]:.0f}%')
