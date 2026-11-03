"""Drive claude-swap 0.29.0's real AutoSwitchEngine with a fake switcher,
fake usage, and a fake clock. No CLI, no Keychain, no network.

Run with HOME pointing inside this directory (see run.sh).
"""

from __future__ import annotations

import json
import os
import random
import shutil
import socket
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

SIM = Path(__file__).resolve().parent
HOME = Path(os.environ["HOME"]).resolve()
assert SIM in HOME.parents, f"HOME {HOME} must live under {SIM}"


def _deny(*_a, **_k):
    raise RuntimeError("blocked inside the simulation (network/subprocess)")


socket.socket.connect = _deny
socket.create_connection = _deny
subprocess.Popen = _deny
subprocess.run = _deny
os.system = _deny

from importlib.metadata import version  # noqa: E402

from claude_swap import autoswitch as aw  # noqa: E402
from claude_swap import paths  # noqa: E402
from claude_swap.autoswitch import AutoSwitchEngine, TickOutcome  # noqa: E402
from claude_swap.lines import binding_window  # noqa: E402
from claude_swap.oauth import relevant_windows, account_headroom  # noqa: E402
from claude_swap.settings import AutoSwitchSettings  # noqa: E402
from claude_swap.switcher import ClaudeAccountSwitcher  # noqa: E402
from claude_swap.usage_store import UsageEntry  # noqa: E402

assert version("claude-swap") == "0.29.0", version("claude-swap")
assert SIM in paths.get_backup_root().resolve().parents, paths.get_backup_root()

# Deterministic loop delay: _next_delay jitters with random.random().
aw.random.random = lambda: 0.5

NAMES = {"1": "work", "2": "personal", "3": "personal2"}
SLOT = {v: k for k, v in NAMES.items()}
H = 3600.0
D = 86400.0
T0 = datetime(2026, 11, 3, 9, 0, tzinfo=timezone.utc).timestamp()


def iso(ts: float | None) -> str | None:
    if ts is None:
        return None
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat().replace("+00:00", "Z")


def hhmm(ts: float) -> str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%H:%M")


class Clock:
    def __init__(self, now: float) -> None:
        self.now = now

    def __call__(self) -> float:
        return self.now


@dataclass
class Acct:
    h5: float = 0.0
    h5_start: float | None = None  # 5h window start; None = no window running
    d7: float = 0.0
    d7_reset: float | None = None
    h5_reset_override: float | None = None  # snapshot scenarios only

    def h5_reset(self) -> float | None:
        if self.h5_reset_override is not None:
            return self.h5_reset_override
        return None if self.h5_start is None else self.h5_start + 5 * H

    def usage(self) -> dict:
        five = {"pct": round(self.h5, 6)}
        r5 = self.h5_reset()
        if r5 is not None:
            five["resets_at"] = iso(r5)
        seven = {"pct": round(self.d7, 6)}
        if self.d7_reset is not None:
            seven["resets_at"] = iso(self.d7_reset)
        return {"five_hour": five, "seven_day": seven}


@dataclass
class World:
    clock: Clock
    accts: dict[str, Acct]
    active: str
    tiers: dict[str, int] = field(default_factory=dict)
    lines: dict[str, float] = field(default_factory=dict)
    disabled: set[str] = field(default_factory=set)

    def sequence(self) -> dict:
        accounts = {}
        for num in ("1", "2", "3"):
            rec = {"email": f"{NAMES[num]}@example.invalid", "organizationUuid": ""}
            if num in self.lines:
                rec["threshold"] = self.lines[num]
            if self.tiers.get(num):
                rec["priority"] = self.tiers[num]
            if num in self.disabled:
                rec["disabled"] = True
            accounts[num] = rec
        return {"sequence": [1, 2, 3], "accounts": accounts}


class FakeSwitcher:
    """Only the surface AutoSwitchEngine touches. Sequence-derived answers
    (switchable slots, per-account policy, manual best) run the REAL
    ClaudeAccountSwitcher code against an in-memory sequence.json."""

    _disabled_from_data = staticmethod(ClaudeAccountSwitcher._disabled_from_data)
    _policy_from_data = staticmethod(ClaudeAccountSwitcher._policy_from_data)
    switchable_account_numbers = ClaudeAccountSwitcher.switchable_account_numbers
    account_policies = ClaudeAccountSwitcher.account_policies
    _select_best_switchable = ClaudeAccountSwitcher._select_best_switchable

    def __init__(self, backup_dir: Path, world: World) -> None:
        self.backup_dir = backup_dir
        self.world = world
        self.switch_calls: list[str] = []

    def _get_sequence_data(self) -> dict:
        return self.world.sequence()

    def _account_is_switchable(self, num: str) -> bool:
        return str(num) in self.world.sequence()["accounts"]

    def set_poll_policy_inputs(self, threshold, weekly_threshold, models) -> None:
        self.poll_inputs = (threshold, weekly_threshold, models)

    def current_account_number(self) -> str:
        return self.world.active

    def has_live_login(self) -> bool:
        return True

    def account_email(self, number: str | None) -> str:
        return f"{NAMES[number]}@example.invalid" if number in NAMES else ""

    def account_kind_for(self, number: str) -> str:
        return "oauth"

    def live_session_pids_for(self, number: str, email: str) -> list:
        return []

    def read_account_credentials(self, number: str, email: str) -> str:
        # Far-future expiry: the real _freshen_target returns "ok" with no POST.
        return json.dumps({"claudeAiOauth": {
            "accessToken": f"fake-at-{number}",
            "refreshToken": f"fake-rt-{number}",
            "expiresAt": (self.world.clock() + 30 * D) * 1000,
        }})

    def account_identity(self, number: str) -> dict:
        return {}

    def consume_backup_grant(self, *a, **k):  # pragma: no cover - never near expiry
        raise AssertionError("freshen should never need a refresh in the sim")

    def usage_entries_by_account(self, fetch=None, *, scheduled=False) -> dict:
        now = self.world.clock()
        return {
            num: UsageEntry(
                last_good=acct.usage(), fetched_at=now, age_s=0.0, last_attempt_at=now
            )
            for num, acct in self.world.accts.items()
        }

    def switch_to(self, number: str, json_output: bool = False) -> dict:
        self.switch_calls.append(number)
        previous = self.world.active
        self.world.active = number
        return {
            "switched": True,
            "from": {"number": int(previous), "email": self.account_email(previous)},
            "to": {"number": int(number), "email": self.account_email(number)},
            "warnings": [],
        }


# ---------------------------------------------------------------------------
# Configs
# ---------------------------------------------------------------------------

TIERS = {SLOT["personal2"]: 100, SLOT["work"]: 50, SLOT["personal"]: 10}
LINES = {SLOT["personal2"]: 92.0, SLOT["work"]: 85.0, SLOT["personal"]: 75.0}
CONFIGS = {
    "A": dict(strategy="best", tiers={}, lines={}),
    "B": dict(strategy="priority-consume-first", tiers=TIERS, lines={}),
    "C": dict(strategy="best", tiers={}, lines=LINES),
    "D": dict(strategy="consume-first", tiers={}, lines={}),
    "E": dict(strategy="priority-consume-first", tiers=TIERS, lines=LINES),
    "F": dict(strategy="priority-consume-first",
              tiers={SLOT["personal2"]: 100, SLOT["work"]: 100, SLOT["personal"]: 10}, lines={}),
    "G": dict(strategy="priority-consume-first",
              tiers={SLOT["personal2"]: 100, SLOT["work"]: 100, SLOT["personal"]: 10}, lines={},
              disabled={SLOT["personal"]}),
}


def settings_for(strategy: str) -> AutoSwitchSettings:
    return AutoSwitchSettings(
        threshold=85.0,
        weekly_threshold=95.0,
        interval_seconds=60.0,
        cooldown_seconds=300.0,
        hysteresis_pct=10.0,
        strategy=strategy,
        include_api_key_accounts=False,
        unhealthy_ticks=3,
        model=None,
    )


class Run:
    def __init__(self, root: Path, name: str, world: World, strategy: str) -> None:
        self.dir = root / name
        if self.dir.exists():
            shutil.rmtree(self.dir)
        self.dir.mkdir(parents=True)
        self.world = world
        self.switcher = FakeSwitcher(self.dir, world)
        self.events: list[dict] = []
        self.engine = AutoSwitchEngine(
            self.switcher,
            settings_for(strategy),
            self._on_event,
            dry_run=False,
            state_path=self.dir / "autoswitch_state.json",
            clock=world.clock,
        )

    def _on_event(self, event) -> None:
        payload = event.to_json()
        payload["simTime"] = hhmm(self.world.clock())
        self.events.append(payload)

    def tick(self) -> tuple[TickOutcome, list[dict]]:
        start = len(self.events)
        outcome = self.engine.tick()
        return outcome, self.events[start:]


def bindings(run: Run) -> dict:
    """Each account's binding window under the tick's real lines (observed)."""
    eng = run.engine
    th = eng._resolve_thresholds()
    out = {}
    for num, acct in run.world.accts.items():
        b = eng._binding(acct.usage(), eng.settings, th[num])
        out[NAMES[num]] = {
            "binding": b.label,
            "pct": b.pct,
            "line": b.line,
            "lineHeadroom": round(b.line_headroom, 2),
            "over": b.over,
            "rawHeadroom": account_headroom(acct.usage()),
        }
    return out


def summarize(outcome: TickOutcome, events: list[dict]) -> dict:
    sw = [e for e in events if e["event"] == "switch"]
    if sw:
        e = sw[-1]
        return {"outcome": outcome.name, "switch": NAMES[str(e["to"]["number"])], "trigger": e["trigger"]}
    ns = [e for e in events if e["event"] in ("no-switch", "all-exhausted", "error")]
    e = ns[-1] if ns else {}
    return {
        "outcome": outcome.name,
        "reason": e.get("reason") or e.get("event"),
        "detail": e.get("detail") or e.get("message") or e.get("earliestResetAt"),
    }


# ---------------------------------------------------------------------------
# Snapshot scenarios
# ---------------------------------------------------------------------------

# 7d reset assumption (not given by the brief except S10): fuller weekly
# window = older window = sooner reset.
RESETS_DEFAULT = {"work": 2 * D, "personal2": 4 * D, "personal": 6 * D}
RESETS_REVERSED = {"work": 6 * D, "personal2": 4 * D, "personal": 2 * D}
H5_RESET = 2.5 * H  # any running 5h window resets 2.5h out unless stated


def mk(h5: float, d7: float, name: str, resets: dict, h5_reset: float | None = None,
       d7_reset: float | None | str = "default") -> Acct:
    a = Acct(h5=h5, d7=d7)
    if h5 > 0:
        a.h5_reset_override = T0 + (h5_reset if h5_reset is not None else H5_RESET)
    a.d7_reset = (T0 + resets[name]) if d7_reset == "default" else (
        None if d7_reset is None else T0 + d7_reset)
    return a


def scenarios(resets: dict) -> dict:
    def acc(**kw):
        return {name: mk(*vals, name, resets) for name, vals in kw.items()}

    s = {}
    s["S1"] = dict(active="personal", accts=acc(work=(0, 0), personal=(0, 0), personal2=(0, 0)))
    s["S1b-no7dReset"] = dict(active="personal", accts={
        n: mk(0, 0, n, resets, d7_reset=None) for n in ("work", "personal", "personal2")})
    s["S2"] = dict(active="work", accts=acc(work=(40, 50), personal=(40, 50), personal2=(40, 50)))
    s["S3"] = dict(active="personal2", accts=acc(personal=(0, 10), personal2=(86, 80), work=(60, 85)))
    s["S3-alt-p2at70"] = dict(active="personal2", accts=acc(personal=(0, 10), personal2=(70, 80), work=(60, 85)))
    s["S4"] = dict(active="personal2", accts=acc(personal2=(86, 50), work=(20, 60), personal=(0, 30)))
    s["S5"] = dict(active="personal2", accts=acc(personal2=(20, 96), work=(30, 91), personal=(50, 40)))
    s["S6"] = dict(active="personal", disabled={"personal2"},
                   accts=acc(personal=(86, 30), work=(5, 91), personal2=(0, 50)))
    s["S7"] = dict(active="work", accts=acc(work=(50, 60), personal2=(0, 40), personal=(0, 20)))
    s["S8"] = dict(active="personal2", accts=acc(personal2=(97, 50), work=(40, 97), personal=(90, 30)))
    s["S8-active-work"] = dict(active="work", accts=acc(personal2=(97, 50), work=(40, 97), personal=(90, 30)))
    s["S8-active-personal"] = dict(active="personal", accts=acc(personal2=(97, 50), work=(40, 97), personal=(90, 30)))
    s["S9"] = dict(active="personal2", accts=acc(work=(30, 30), personal=(30, 30), personal2=(86, 50)))
    s["S10"] = dict(active="personal2", accts={
        "personal2": mk(86, 60, "personal2", resets, d7_reset=6 * D),
        "work": mk(20, 70, "work", resets, d7_reset=1 * D),
        "personal": mk(20, 70, "personal", resets, d7_reset=3 * D),
    })
    return s


def run_snapshots(root: Path, resets: dict, tag: str) -> dict:
    results = {}
    for sname, spec in scenarios(resets).items():
        row = {"inputs": {n: a.usage() for n, a in spec["accts"].items()}, "active": spec["active"]}
        row["disabled"] = sorted(spec.get("disabled", set()))
        per = {}
        for cname, cfg in CONFIGS.items():
            clock = Clock(T0)
            world = World(
                clock=clock,
                accts={SLOT[n]: Acct(**vars(a)) for n, a in spec["accts"].items()},
                active=SLOT[spec["active"]],
                tiers=cfg["tiers"], lines=cfg["lines"],
                disabled={SLOT[n] for n in spec.get("disabled", set())} | cfg.get("disabled", set()),
            )
            run = Run(root / f"snap-{tag}", f"{sname}-{cname}", world, cfg["strategy"])
            b = bindings(run)
            outcome, events = run.tick()
            per[cname] = {**summarize(outcome, events), "bindings": b, "events": events}
        # Manual `switch --strategy best` (real _select_best_switchable).
        clock = Clock(T0)
        world = World(clock=clock, accts={SLOT[n]: a for n, a in spec["accts"].items()},
                      active=SLOT[spec["active"]],
                      disabled={SLOT[n] for n in spec.get("disabled", set())})
        fs = FakeSwitcher(root, world)
        usage = {num: a.usage() for num, a in world.accts.items()}
        target, note = fs._select_best_switchable(world.active, (), usage)
        row["manualBest"] = {"target": NAMES.get(target) if target else None, "note": note}
        row["configs"] = per
        results[sname] = row
    return results


# ---------------------------------------------------------------------------
# Timelines (day and week) through one generic minute loop
# ---------------------------------------------------------------------------

HEAVY, LIGHT = 1.2, 0.3  # 5h %/min on a base-size plan; 7d burns at 1/10 of it


def day_demand(t: float) -> float:
    minute = int((t - T0) // 60)
    return HEAVY if (0 <= minute < 180 or 360 <= minute < 540) else LIGHT  # 09-12, 15-18


W0 = datetime(2026, 11, 2, 9, 0, tzinfo=timezone.utc).timestamp()  # Monday 09:00
WEEK_RESETS = {
    "work": datetime(2026, 11, 4, 12, 0, tzinfo=timezone.utc).timestamp(),       # Wed 12:00
    "personal": datetime(2026, 11, 5, 8, 0, tzinfo=timezone.utc).timestamp(),    # Thu 08:00
    "personal2": datetime(2026, 11, 7, 10, 0, tzinfo=timezone.utc).timestamp(),  # Sat 10:00
}
WEEK_START_7D = {"work": 40.0, "personal": 30.0, "personal2": 10.0}
APP_BURSTS = ((8, 0), (12, 30), (17, 30), (22, 0))  # personal's app load, 10 min each
APP_RATE_7D = 0.25  # 7d pts/min: 4 bursts x 10 min x 0.25 = 10 pts/day
# Calibrated from the user's Pro log: heavy 1.1 5h-%/min on a 1-unit plan,
# light = heavy/4, 7d moves 1/6 of 5h. Plans: work Max 5x (5u), personal and
# personal2 Pro (1u); a plan's % rate is the Pro rate / its units.
WEEK_HEAVY, WEEK_LIGHT, WEEK_D7_RATIO = 1.1, 1.1 / 4, 6.0
WEEK_FACTOR = {SLOT["work"]: 1 / 5}


def _mins(t: float) -> tuple[int, int]:
    dt = datetime.fromtimestamp(t, tz=timezone.utc)
    return dt.weekday(), dt.hour * 60 + dt.minute


def week_demand(t: float) -> float:
    wd, mins = _mins(t)
    if wd < 5:
        return WEEK_HEAVY if (540 <= mins < 780 or 900 <= mins < 1200) else 0.0
    return WEEK_LIGHT if 600 <= mins < 780 else 0.0


def week_app(t: float) -> float:
    _, mins = _mins(t)
    for hh, mm in APP_BURSTS:
        if hh * 60 + mm <= mins < hh * 60 + mm + 10:
            return APP_RATE_7D
    return 0.0


def _windows(a: Acct) -> dict:
    return {"5h": round(a.h5, 2), "7d": round(a.d7, 2)}


def simulate(root: Path, label: str, cname: str, *, t0: float, minutes: int,
             start_7d: dict, resets_at: dict, active: str, disabled=(),
             demand, factor: dict | None = None, app=None, keep_events: bool = False,
             d7_ratio: float = 10.0) -> dict:
    cfg = CONFIGS[cname]
    factor = factor or {}
    clock = Clock(t0)
    accts = {SLOT[n]: Acct(d7=start_7d[n], d7_reset=resets_at[n])
             for n in ("work", "personal", "personal2")}
    world = World(clock=clock, accts=accts, active=SLOT[active], tiers=cfg["tiers"],
                  lines=cfg["lines"],
                  disabled={SLOT[n] for n in disabled} | cfg.get("disabled", set()))
    run = Run(root, f"{cname}-{label}", world, cfg["strategy"])
    eng = run.engine
    th = eng._resolve_thresholds()
    kept: list[dict] = []
    switches, weekly, samples = [], [], []
    reasons: dict[str, int] = {}
    per_day: dict[str, int] = {}
    m = dict(demand=0.0, served=0.0, blocked=0.0, demandMin=0, overLine=0,
             p_cc7=0.0, p_app7=0.0, app_unserved7=0.0, p_chosen_others_under=0)
    served_by = {n: 0.0 for n in NAMES.values()}
    next_tick = t0
    for minute in range(minutes):
        t = t0 + minute * 60
        clock.now = t
        for num, a in accts.items():
            if a.h5_start is not None and t >= a.h5_start + 5 * H:
                a.h5, a.h5_start = 0.0, None
            if a.d7_reset is not None and t >= a.d7_reset:
                weekly.append({"account": NAMES[num], "t": iso(a.d7_reset),
                               "unusedPct": round(100.0 - a.d7, 2)})
                a.d7, a.d7_reset = 0.0, a.d7_reset + 7 * D
        if t >= next_tick:
            before = {NAMES[n]: _windows(a) for n, a in accts.items()}
            outcome, events = run.tick()
            for e in events:
                if e["event"] == "switch":
                    fr, to = str(e["from"]["number"]), str(e["to"]["number"])
                    under = {}
                    for other in ("personal2", "work"):
                        o = SLOT[other]
                        if o in world.disabled:
                            continue
                        b = eng._binding(accts[o].usage(), eng.settings, th[o])
                        under[other] = (not b.over) and (account_headroom(accts[o].usage()) or 0) > 0
                    if NAMES[to] == "personal" and any(under.values()):
                        m["p_chosen_others_under"] += 1
                    day = datetime.fromtimestamp(t, tz=timezone.utc).strftime("%a %m-%d")
                    per_day[day] = per_day.get(day, 0) + 1
                    switches.append({
                        "t": iso(t), "time": hhmm(t), "day": day, "from": NAMES[fr], "to": NAMES[to],
                        "trigger": e["trigger"], "fromWindows": before[NAMES[fr]],
                        "toWindows": before[NAMES[to]], "underLinesAtSwitch": under,
                    })
                elif e["event"] in ("no-switch", "all-exhausted", "error"):
                    key = e.get("reason") or e["event"]
                    reasons[key] = reasons.get(key, 0) + 1
            if keep_events:
                kept.extend(events)
            run.events.clear()
            next_tick = t + eng._next_delay(outcome)
        if minute % 15 == 0:
            samples.append({"t": iso(t), "active": NAMES[world.active],
                            "perAccount": {NAMES[n]: _windows(a) for n, a in accts.items()}})
        if app is not None:
            r7 = app(t)
            if r7:
                p = accts[SLOT["personal"]]
                r5 = r7 * d7_ratio
                f = max(0.0, min(1.0, (100 - p.h5) / r5, (100 - p.d7) / r7))
                if f > 0 and p.h5_start is None:
                    p.h5_start = t
                p.h5 = min(100.0, p.h5 + r5 * f)
                p.d7 = min(100.0, p.d7 + r7 * f)
                m["p_app7"] += r7 * f
                m["app_unserved7"] += r7 * (1 - f)
        base = demand(t)
        if not base:
            continue
        m["demand"] += base
        m["demandMin"] += 1
        a = accts[world.active]
        if eng._binding(a.usage(), eng.settings, th[world.active]).over:
            m["overLine"] += 1
        r5 = base * factor.get(world.active, 1.0)
        r7 = r5 / d7_ratio
        f = max(0.0, min(1.0, (100 - a.h5) / r5, (100 - a.d7) / r7))
        if f > 0 and a.h5_start is None:
            a.h5_start = t
        a.h5 = min(100.0, a.h5 + r5 * f)
        a.d7 = min(100.0, a.d7 + r7 * f)
        m["served"] += base * f
        m["blocked"] += 1 - f
        served_by[NAMES[world.active]] += base * f
        if world.active == SLOT["personal"]:
            m["p_cc7"] += r7 * f

    triggers: dict[str, int] = {}
    for s in switches:
        triggers[s["trigger"]] = triggers.get(s["trigger"], 0) + 1
    p_total = m["p_cc7"] + m["p_app7"]
    stamps = [datetime.fromisoformat(s["t"].replace("Z", "+00:00")).timestamp() for s in switches]
    gaps = [(b - a) / 60 for a, b in zip(stamps, stamps[1:])]
    return {
        "config": cname, "label": label,
        "metrics": {
            "totalSwitches": len(switches), "switchesPerDay": per_day, "switchTriggers": triggers,
            "minGapMinutes": round(min(gaps), 1) if gaps else None,
            "gapsUnder30Min": sum(g < 30 for g in gaps),
            "blockedMinutes": round(m["blocked"], 1), "demandMinutes": m["demandMin"],
            "activeOverLineDemandMinutes": m["overLine"],
            "demandServedPct": round(100 * m["served"] / m["demand"], 2) if m["demand"] else None,
            "demandServedShareByAccountPct": {
                k: round(100 * v / m["served"], 1) if m["served"] else 0 for k, v in served_by.items()},
            "weeklyResets": weekly,
            "personal7dConsumed": {
                "claudeCode": round(m["p_cc7"], 2), "app": round(m["p_app7"], 2),
                "claudeCodeSharePct": round(100 * m["p_cc7"] / p_total, 1) if p_total else None,
                "appUnservedPts": round(m["app_unserved7"], 2)},
            "personalChosenWhileP2OrWorkUnderLines": m["p_chosen_others_under"],
            "noSwitchReasonCounts": reasons,
            "end": {NAMES[n]: {**_windows(a), "d7ResetsAt": iso(a.d7_reset)} for n, a in accts.items()},
            "activeAtEnd": NAMES[world.active],
        },
        "switches": switches, "samples": samples, **({"events": kept} if keep_events else {}),
    }


def run_day(root: Path, cname: str, *, variant: str, resets: dict, tag: str) -> dict:
    return simulate(
        root / "timeline", f"{variant}-{tag}", cname, t0=T0, minutes=600,
        start_7d={"personal2": 50.0, "work": 70.0, "personal": 30.0},
        resets_at={n: T0 + resets[n] for n in NAMES.values()},
        active="work" if variant == "p2-disabled" else "personal2",
        disabled=("personal2",) if variant == "p2-disabled" else (),
        demand=day_demand, keep_events=True)


def run_week(root: Path, cname: str) -> dict:
    return simulate(
        root / "week", "calibrated", cname, t0=W0, minutes=7 * 1440,
        start_7d=WEEK_START_7D, resets_at=WEEK_RESETS, active="personal2",
        demand=week_demand, factor=WEEK_FACTOR, app=week_app, d7_ratio=WEEK_D7_RATIO)


def outcome_row(r: dict) -> dict:
    keep = {k: r[k] for k in ("outcome", "switch", "trigger", "reason", "detail", "bindings") if k in r}
    keep["result"] = "switch" if "switch" in r else ("blocked" if r["outcome"] == "BLOCKED" else "stay")
    return keep


def main() -> None:
    root = SIM / "runs"
    out = SIM / "results"
    out.mkdir(exist_ok=True)
    snaps = run_snapshots(root, RESETS_DEFAULT, "default")
    snaps_rev = run_snapshots(root, RESETS_REVERSED, "reversed")
    days, weeks = {}, {}
    for cname in CONFIGS:
        for tag, resets in (("default", RESETS_DEFAULT), ("reversed", RESETS_REVERSED)):
            for variant in ("all3", "p2-disabled"):
                days[f"{cname}/{variant}/{tag}"] = run_day(root, cname, variant=variant, resets=resets, tag=tag)
        weeks[cname] = run_week(root, cname)
        print(cname, weeks[cname]["metrics"]["totalSwitches"], flush=True)
    meta = {
        "claudeSwap": version("claude-swap"), "python": sys.version.split()[0],
        "home": str(HOME), "backupRoot": str(paths.get_backup_root()),
        "dayT0": iso(T0), "weekT0": iso(W0), "resetsDefault": RESETS_DEFAULT, "resetsReversed": RESETS_REVERSED,
    }
    (out / "snapshots.json").write_text(json.dumps({"meta": meta, "default": snaps, "reversed": snaps_rev}, indent=1))
    (out / "timelines.json").write_text(json.dumps({"meta": meta, "runs": days}, indent=1))
    (out / "weeks.json").write_text(json.dumps({"meta": meta, "runs": weeks}, indent=1))

    def slim(r: dict) -> dict:
        return {"metrics": r["metrics"], "switches": r["switches"], "samples": r["samples"]}

    results = {
        "meta": {
            **meta,
            "settings": {"threshold": 85, "weeklyThreshold": 95, "intervalSeconds": 60,
                         "cooldownSeconds": 300, "hysteresisPct": 10, "unhealthyTicks": 3,
                         "model": None, "includeApiKeyAccounts": False},
            "slots": {num: name for num, name in NAMES.items()},
            "sampleEveryMinutes": 15,
            "assumptions": {
                "snapshot7dResetsDefault": "work +2d, personal2 +4d, personal +6d (reversed: work +6d, personal +2d)",
                "snapshot5hReset": "+2.5h for any 5h window above 0; none at 0",
                "dayRates": "heavy 1.2 5h-%/min 09-12 & 15-18, light 0.3 otherwise; 7d = 5h/10",
                "week": "Mon 2026-11-02 09:00 -> Mon 09:00; weekdays 09-13 & 15-20 heavy, weekend 10-13 light; start active personal2; 7d start work 40 personal 30 personal2 10; weekly resets work Wed 12:00, personal Thu 08:00, personal2 Sat 10:00",
                "weekRates": "Pro heavy 1.1 5h-%/min, light 0.275, 7d = 5h/6; work (Max 5x) at 1/5 of that; personal & personal2 Pro",
                "appLoad": "personal only, 4 x 10-min bursts/day (08:00 12:30 17:30 22:00) at 0.25 7d-pts/min = 10 pts/day, 5h at 6x, capped at 100",
                "configG": "F with personal disabled (cswap disable personal)",
                "polling": "every tick sees exact, fresh usage for all accounts",
            },
        },
        "configs": {
            c: {"strategy": cfg["strategy"],
                "disabled": sorted(NAMES[k] for k in cfg.get("disabled", set())),
                "tiers": {NAMES[k]: v for k, v in cfg["tiers"].items()},
                "lines": {NAMES[k]: v for k, v in cfg["lines"].items()}}
            for c, cfg in CONFIGS.items()
        },
        "scenarioInputs": {
            s: {k: row[k] for k in ("active", "disabled", "inputs", "manualBest")}
            for s, row in snaps.items()
        },
        "byConfig": {
            c: {
                "scenarios": {s: outcome_row(row["configs"][c]) for s, row in snaps.items()},
                "scenariosReversedResets": {s: outcome_row(row["configs"][c]) for s, row in snaps_rev.items()},
                "timelines": {
                    "day-all3": slim(days[f"{c}/all3/default"]),
                    "day-p2-disabled": slim(days[f"{c}/p2-disabled/default"]),
                    "day-all3-reversedResets": slim(days[f"{c}/all3/reversed"]),
                    "day-p2-disabled-reversedResets": slim(days[f"{c}/p2-disabled/reversed"]),
                    "week": slim(weeks[c]),
                },
            }
            for c in CONFIGS
        },
    }
    (SIM / "results.json").write_text(json.dumps(results, indent=1))
    print(json.dumps(meta))


if __name__ == "__main__":
    main()
