"""Drive claude-swap 1.2.0's real AutoSwitchEngine, one engine per Mac, with
fake switchers over shared fake accounts, a fake clock, and no CLI, Keychain
or network.

Run with HOME pointing inside this directory (see run.sh).
"""

from __future__ import annotations

import json
import os
import shutil
import socket
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
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
from claude_swap.autoswitch import (  # noqa: E402
    AllExhaustedEvent,
    AutoSwitchEngine,
    ErrorEvent,
    NoSwitchEvent,
    SwitchEvent,
    TickOutcome,
)
from claude_swap.settings import AutoSwitchSettings  # noqa: E402
from claude_swap.switcher import ClaudeAccountSwitcher  # noqa: E402
from claude_swap.usage_store import UsageEntry  # noqa: E402

assert version("claude-swap") == "1.2.0", version("claude-swap")
assert SIM in paths.get_backup_root().resolve().parents, paths.get_backup_root()
assert Path(aw.__file__).resolve().is_relative_to(SIM / ".venv"), aw.__file__

# _next_delay jitters with random.random(); 0.5 makes every tick exactly 60 s.
aw.random.random = lambda: 0.5

# Real slot numbers on the personal Mac (`cswap list --json`, 2026-11-24).
NAMES = {"1": "work", "2": "personal", "3": "personal2", "4": "work2"}
SLOT = {v: k for k, v in NAMES.items()}
H = 3600.0
D = 86400.0
CET = timezone(timedelta(hours=1))


def iso(ts: float | None) -> str | None:
    if ts is None:
        return None
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat().replace("+00:00", "Z")


def local(ts: float) -> datetime:
    return datetime.fromtimestamp(ts, tz=CET)


def cet(ts: float) -> str:
    return local(ts).strftime("%a %m-%d %H:%M")


class Clock:
    def __init__(self, now: float) -> None:
        self.now = now

    def __call__(self) -> float:
        return self.now


@dataclass
class Acct:
    """One account's account-wide usage, shared by every Mac."""

    h5: float = 0.0
    h5_start: float | None = None  # None: no 5h window running
    d7: float = 0.0
    d7_reset: float | None = None

    def usage(self) -> dict:
        five = {"pct": round(self.h5, 6)}
        if self.h5_start is not None:
            five["resets_at"] = iso(self.h5_start + 5 * H)
        seven = {"pct": round(self.d7, 6)}
        if self.d7_reset is not None:
            seven["resets_at"] = iso(self.d7_reset)
        return {"five_hour": five, "seven_day": seven}

    def binding(self) -> float:
        return max(self.h5, self.d7)

    def exhausted(self) -> bool:
        return self.h5 >= 100.0 or self.d7 >= 100.0

    def below(self, line: float) -> bool:
        """Below its per-account line on every window (weeklyThreshold unset)."""
        return self.h5 < line and self.d7 < line

    def consume(self, t: float, r5: float, r7: float) -> float:
        """Burn one minute at (r5, r7) %/min; return the fraction served."""
        f = max(0.0, min(1.0, (100.0 - self.h5) / r5, (100.0 - self.d7) / r7))
        if f > 0 and self.h5_start is None:
            self.h5_start = t
        self.h5 = min(100.0, self.h5 + r5 * f)
        self.d7 = min(100.0, self.d7 + r7 * f)
        return f


@dataclass
class Mac:
    """One machine's claude-swap view: its own slots, policy and active account."""

    name: str
    slots: list[str]
    active: str
    tiers: dict[str, int] = field(default_factory=dict)
    lines: dict[str, float] = field(default_factory=dict)

    def sequence(self) -> dict:
        accounts = {}
        for num in self.slots:
            rec = {"email": f"{NAMES[num]}@example.invalid", "organizationUuid": ""}
            if num in self.lines:
                rec["threshold"] = self.lines[num]
            if self.tiers.get(num):
                rec["priority"] = self.tiers[num]
            accounts[num] = rec
        return {"sequence": [int(n) for n in self.slots], "accounts": accounts}


class FakeSwitcher:
    """Only the surface AutoSwitchEngine 1.2.0 touches. Sequence-derived
    answers (switchable and disabled slots, per-account policy) run the REAL
    ClaudeAccountSwitcher code against an in-memory sequence.json."""

    _disabled_from_data = staticmethod(ClaudeAccountSwitcher._disabled_from_data)
    _policy_from_data = staticmethod(ClaudeAccountSwitcher._policy_from_data)
    switchable_account_numbers = ClaudeAccountSwitcher.switchable_account_numbers
    disabled_account_numbers = ClaudeAccountSwitcher.disabled_account_numbers
    account_policies = ClaudeAccountSwitcher.account_policies

    def __init__(self, backup_dir: Path, mac: Mac, accts: dict[str, Acct], clock: Clock) -> None:
        self.backup_dir = backup_dir
        self.mac = mac
        self.accts = accts
        self.clock = clock
        self._seq = mac.sequence()

    def _get_sequence_data(self) -> dict:
        return self._seq

    def _account_is_switchable(self, num: str) -> bool:
        return str(num) in self._seq["accounts"]

    def set_poll_policy_inputs(self, threshold, weekly_threshold, models) -> None:
        self.poll_inputs = (threshold, weekly_threshold, models)

    def current_account_number(self) -> str:
        return self.mac.active

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
            "expiresAt": (self.clock() + 30 * D) * 1000,
        }})

    def account_identity(self, number: str) -> dict:
        return {}

    def consume_backup_grant(self, *a, **k):  # pragma: no cover - never near expiry
        raise AssertionError("freshen should never need a refresh in the sim")

    def usage_entries_by_account(self, fetch=None, *, scheduled=False) -> dict:
        # Perfect polling: every slot is freshly measured on every call.
        now = self.clock()
        return {
            num: UsageEntry(last_good=self.accts[num].usage(), fetched_at=now, age_s=0.0,
                            last_attempt_at=now)
            for num in self.mac.slots
        }

    def switch_to(self, number: str, json_output: bool = False, force: bool = False) -> dict:
        previous = self.mac.active
        self.mac.active = number
        return {
            "switched": True,
            "from": {"number": int(previous), "email": self.account_email(previous)},
            "to": {"number": int(number), "email": self.account_email(number)},
            "warnings": [],
        }


def settings_for(strategy: str) -> AutoSwitchSettings:
    return AutoSwitchSettings(
        threshold=85.0,
        weekly_threshold=None,
        interval_seconds=60.0,
        cooldown_seconds=300.0,
        hysteresis_pct=10.0,
        strategy=strategy,
        include_api_key_accounts=False,
        unhealthy_ticks=3,
        model=None,
    )


class Driver:
    """One Mac's engine on the shared clock and accounts."""

    def __init__(self, rundir: Path, mac: Mac, accts: dict[str, Acct], clock: Clock,
                 strategy: str) -> None:
        if rundir.exists():
            shutil.rmtree(rundir)
        rundir.mkdir(parents=True)
        self.mac = mac
        self.clock = clock
        self.events: list = []
        self.switcher = FakeSwitcher(rundir, mac, accts, clock)
        self.engine = AutoSwitchEngine(
            self.switcher, settings_for(strategy), self.events.append, dry_run=False,
            state_path=rundir / "autoswitch_state.json", clock=clock,
        )
        self.next_tick = clock()

    def due(self) -> bool:
        return self.clock() >= self.next_tick

    def tick(self) -> tuple[TickOutcome, list]:
        self.events.clear()
        outcome = self.engine.tick()
        self.next_tick = self.clock() + self.engine._next_delay(outcome)
        return outcome, list(self.events)


def event_kind(e) -> str:
    if isinstance(e, SwitchEvent):
        return "switch"
    if isinstance(e, NoSwitchEvent):
        return e.reason
    if isinstance(e, AllExhaustedEvent):
        return "all-exhausted"
    if isinstance(e, ErrorEvent):
        return "error"
    return ""


def meta() -> dict:
    return {"claudeSwap": version("claude-swap"), "python": sys.version.split()[0],
            "home": str(HOME), "backupRoot": str(paths.get_backup_root())}
