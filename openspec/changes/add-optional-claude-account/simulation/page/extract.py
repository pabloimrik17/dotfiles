import json, sys
src, out = sys.argv[1], sys.argv[2]
d = json.load(open(src))
sw = d['sharedWorkGoal']
ACC = ['personal2', 'work', 'personal']
ORDER = ['A', 'P0', 'P1', 'P1-w60', 'P1-w65', 'P1-w70', 'P2', 'P3', 'P0-noPersonal', 'P1-noPersonal', 'P2-noPersonal']
import os
for _case in ('draw10to15', 'flat15'):
    _f = os.path.join(os.path.dirname(src), 'results', f'week2tune-{_case}.json')
    if os.path.exists(_f):
        sw['cases'][_case].update(json.load(open(_f)))
for _k in ('P1-w60', 'P1-w65', 'P1-w70'):
    sw['configs'].setdefault(_k, {'weekly': None, 'native': 'P1 with work line ' + _k[4:]})
ORDER = [k for k in ORDER if k in sw['cases']['draw10to15'] and k in sw['cases']['flat15']]
if 'P1-w60' not in ORDER:
    sys.exit('missing P1-w60: run week2tune.py for draw10to15 and flat15 first')
t0, t1 = sw['cases']['draw10to15']['A']['metrics']['measurementWindow']
res = {'window': [t0, t1], 'assumptions': sw['assumptions'], 'configs': {}}
for case in ('draw10to15', 'flat15'):
    for k in ORDER:
        x = sw['cases'][case][k]
        m = x['metrics']
        p7 = m.get('personal7d', {})
        row = {
            'switchesPerDay': m['switchesPerDay'], 'minGap': m['minGapMinutes'], 'gaps30': m['gapsUnder30Min'],
            'walls': round(m['personalMacBlockedMinutes']), 'demand': m['personalMacDemandMinutes'],
            'served': m['personalMacServedPct'], 'starved': m['workMacStarvedMinutes'],
            'workBlocked': round(m['workMacUnservedMinutes']),
            'workAtReset': [round(c['d7BeforeReset']) for c in m['workCycles']],
            'byPersonalMac': [round(c['byPersonalMac7dPts']) for c in m['workCycles']],
            'p2AtReset': [round(r['d7BeforeReset']) for r in m['weeklyResets'] if r['account'] == 'personal2'],
            'personalCC': round(p7.get('claudeCode', 0)), 'personalMax': round(p7.get('max7d', 0)),
            'appUnserved': round(p7.get('appUnservedPts', 0), 1),
        }
        c = res['configs'].setdefault(k, {'native': sw['configs'][k]['native'], 'spec': sw['configs'][k]})
        c.setdefault('metrics', {})[case] = row
        if case == 'draw10to15':
            smp = [s for s in x['samples'] if t0 <= s['t'] <= t1]
            c['t'] = [s['t'][5:16] for s in smp]
            c['active'] = [ACC.index(s['active']) if s['active'] in ACC else -1 for s in smp]
            c['d7'] = [[round(s['perAccount'][a]['7d'], 1) for s in smp] for a in ACC]
            c['h5'] = [[round(s['perAccount'][a]['5h'], 1) for s in smp] for a in ACC]
            c['lines'] = [[round(s.get('lines', {}).get(a, 0), 1) for s in smp] for a in ACC]
            c['switches'] = [{'t': w['t'][5:16], 'day': w['day'], 'time': w['time'], 'from': w['from'], 'to': w['to'], 'trigger': w['trigger'],
                              'f5': round(w['fromWindows']['5h']), 'f7': round(w['fromWindows']['7d'])}
                             for w in x['switches'] if t0 <= w['t'] <= t1]
json.dump(res, open(out, 'w'), separators=(',', ':'))
for k in ORDER:
    m = res['configs'][k]['metrics']
    print(k, json.dumps(m['draw10to15']), '| flat15 walls', m['flat15']['walls'], 'starved', m['flat15']['starved'], 'blocked', m['flat15']['workBlocked'])
