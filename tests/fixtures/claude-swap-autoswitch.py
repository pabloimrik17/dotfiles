"""Exercise claude-swap's real autoswitch engine against the repository policy.

Settings come from the managed settings.json and tiers/lines from the setup
template's ROTATION_POLICY. Accounts, usage and the clock are fakes; HOME is a
temporary directory and network/subprocess calls are refused. The fake
switcher is the one from the change's simulation harness: sequence-derived
answers run real ClaudeAccountSwitcher code against an in-memory sequence.json.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SETTINGS_SOURCE = REPO / "private_dot_claude-swap-backup" / "private_settings.json"
SETUP_TEMPLATE = REPO / "dot_local" / "bin" / "executable_claude-swap-setup.tmpl"

SANDBOX = Path(tempfile.mkdtemp(prefix="claude-swap-autoswitch-")).resolve()
os.environ["HOME"] = str(SANDBOX / "home")
os.environ["XDG_DATA_HOME"] = str(SANDBOX / "home" / "xdg")
os.environ["CLAUDE_CONFIG_DIR"] = str(SANDBOX / "home" / ".claude")
(SANDBOX / "home" / ".claude").mkdir(parents=True)


def _deny(*_args, **_kwargs):
    raise RuntimeError("network and subprocess calls are blocked in this fixture")


socket.socket.connect = _deny
socket.create_connection = _deny
subprocess.Popen = _deny
subprocess.run = _deny
os.system = _deny

from importlib.metadata import version

from claude_swap import autoswitch, paths
from claude_swap.autoswitch import AutoSwitchEngine, TickOutcome
from claude_swap.settings import load_settings
from claude_swap.switcher import ClaudeAccountSwitcher
from claude_swap.usage_store import UsageEntry

assert SANDBOX in paths.get_backup_root().resolve().parents, paths.get_backup_root()
autoswitch.random.random = lambda: 0.5

SLOTS = {"personal": "1", "work": "2", "personal2": "3"}
NAMES = {number: name for name, number in SLOTS.items()}
NOW = datetime(2026, 11, 4, 18, 0, tzinfo=timezone.utc).timestamp()
HOUR = 3600.0
DAY = 86400.0
WEEKLY_RESET_DAYS = {"work": 1.0, "personal": 2.0, "personal2": 4.0}


def iso(timestamp: float) -> str:
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat().replace("+00:00", "Z")


def declared_policy() -> tuple[dict[str, int], dict[str, float]]:
    match = re.search(r'^ROTATION_POLICY="([^"]*)"$', SETUP_TEMPLATE.read_text(), re.M)
    assert match, "ROTATION_POLICY is missing from the setup template"
    tiers: dict[str, int] = {}
    lines: dict[str, float] = {}
    for entry in match.group(1).split():
        alias, tier, line = entry.split(":")
        tiers[alias] = int(tier)
        lines[alias] = float(line)
    return tiers, lines


TIERS, LINES = declared_policy()


class Clock:
    def __init__(self) -> None:
        self.now = NOW

    def __call__(self) -> float:
        return self.now


class World:
    def __init__(
        self,
        clock: Clock,
        active: str,
        usage: dict[str, tuple[float, float] | None],
        *,
        disabled: tuple[str, ...] = (),
        errors: dict[str, str] | None = None,
        stale: tuple[str, ...] = (),
        dead_logins: tuple[str, ...] = (),
    ) -> None:
        self.clock = clock
        self.active = SLOTS[active]
        self.usage = usage
        self.disabled = set(disabled)
        self.errors = errors or {}
        self.stale = set(stale)
        self.dead_logins = set(dead_logins)

    def sequence(self) -> dict:
        accounts = {}
        for name in self.usage:
            record = {
                "email": f"{name}@example.invalid",
                "organizationUuid": "",
                "alias": name,
                "priority": TIERS[name],
                "threshold": LINES[name],
            }
            if name in self.disabled:
                record["disabled"] = True
            accounts[SLOTS[name]] = record
        return {"sequence": [int(SLOTS[name]) for name in self.usage], "accounts": accounts}

    def usage_payload(self, name: str) -> dict | None:
        windows = self.usage[name]
        if windows is None:
            return None
        five, seven = windows
        return {
            "five_hour": {"pct": five, "resets_at": iso(self.clock() + 2 * HOUR)},
            "seven_day": {
                "pct": seven,
                "resets_at": iso(self.clock() + WEEKLY_RESET_DAYS[name] * DAY),
            },
        }


class FakeSwitcher:
    _disabled_from_data = staticmethod(ClaudeAccountSwitcher._disabled_from_data)
    _policy_from_data = staticmethod(ClaudeAccountSwitcher._policy_from_data)
    switchable_account_numbers = ClaudeAccountSwitcher.switchable_account_numbers
    account_policies = ClaudeAccountSwitcher.account_policies

    def __init__(self, backup_dir: Path, world: World) -> None:
        self.backup_dir = backup_dir
        self.world = world
        self.switch_calls: list[str] = []

    def _get_sequence_data(self) -> dict:
        return self.world.sequence()

    def _account_is_switchable(self, number: str) -> bool:
        return str(number) in self.world.sequence()["accounts"]

    def set_poll_policy_inputs(self, *_args) -> None:
        pass

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
        if NAMES[number] in self.world.dead_logins:
            return "{}"
        return json.dumps(
            {
                "claudeAiOauth": {
                    "accessToken": f"fixture-at-{number}",
                    "refreshToken": f"fixture-rt-{number}",
                    "expiresAt": (self.world.clock() + 30 * DAY) * 1000,
                }
            }
        )

    def account_identity(self, number: str) -> dict:
        return {}

    def consume_backup_grant(self, *_args, **_kwargs):
        raise AssertionError("fixture credentials never need a refresh")

    def usage_entries_by_account(self, fetch=None, *, scheduled=False) -> dict:
        now = self.world.clock()
        entries = {}
        for name in self.world.usage:
            stale = name in self.world.stale
            entries[SLOTS[name]] = UsageEntry(
                last_good=self.world.usage_payload(name),
                fetched_at=now - 600 if stale else now,
                age_s=600.0 if stale else 0.0,
                last_attempt_at=now,
                last_error=self.world.errors.get(name),
                consecutive_failures=1 if name in self.world.errors else 0,
                last_429_at=now if self.world.errors.get(name) == "http-429" else None,
                trust_extended=stale,
            )
        return entries

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


class Scenario:
    def __init__(self, name: str, world: World, *, seed_state: dict | None = None) -> None:
        self.root = SANDBOX / "scenarios" / name
        self.root.mkdir(parents=True)
        shutil.copyfile(SETTINGS_SOURCE, self.root / "settings.json")
        settings = load_settings(self.root)
        assert settings.strategy == "priority-consume-first", settings.strategy
        assert settings.weekly_threshold is None, settings.weekly_threshold
        state_path = self.root / "autoswitch_state.json"
        if seed_state is not None:
            state_path.write_text(json.dumps(seed_state), encoding="utf-8")
        self.world = world
        self.switcher = FakeSwitcher(self.root, world)
        self.events: list[dict] = []
        self.engine = AutoSwitchEngine(
            self.switcher,
            settings,
            lambda event: self.events.append(event.to_json()),
            dry_run=False,
            state_path=state_path,
            clock=world.clock,
        )

    def tick(self) -> dict:
        start = len(self.events)
        outcome = self.engine.tick()
        events = self.events[start:]
        switches = [event for event in events if event["event"] == "switch"]
        if switches:
            return {
                "outcome": outcome.name,
                "to": NAMES[str(switches[-1]["to"]["number"])],
                "trigger": switches[-1]["trigger"],
            }
        reasons = [
            event.get("reason") or event["event"]
            for event in events
            if event["event"] in ("no-switch", "all-exhausted", "account-quarantined", "error")
        ]
        return {"outcome": outcome.name, "active": NAMES[self.world.active], "reasons": reasons}


def single_tick(name: str, active: str, usage: dict, **kwargs) -> dict:
    seed_state = kwargs.pop("seed_state", None)
    return Scenario(name, World(Clock(), active, usage, **kwargs), seed_state=seed_state).tick()


def main() -> None:
    results: dict[str, object] = {}

    results["higherTierUsable"] = single_tick(
        "higher-tier", "work", {"personal": (0, 30), "work": (20, 40), "personal2": (0, 10)}
    )
    results["cooldown"] = single_tick(
        "cooldown",
        "work",
        {"personal": (0, 30), "work": (20, 40), "personal2": (0, 10)},
        seed_state={"schemaVersion": 1, "lastSwitchAt": NOW - 100},
    )
    results["lineDeparture"] = single_tick(
        "line-departure", "personal2", {"personal": (0, 30), "work": (20, 40), "personal2": (95, 50)}
    )
    results["weeklyLineDeparture"] = single_tick(
        "weekly-line-departure",
        "personal2",
        {"personal": (0, 30), "work": (20, 40), "personal2": (50, 95)},
    )
    results["heldOutMovesOn"] = single_tick(
        "held-out-moves-on",
        "work",
        {"personal": (0, 30), "work": (10, 62), "personal2": (0, 10)},
        disabled=("personal2",),
    )
    results["workAboveLineSkipped"] = single_tick(
        "work-above-line", "personal2", {"personal": (40, 40), "work": (10, 62), "personal2": (95, 50)}
    )
    results["heldOut"] = single_tick(
        "held-out",
        "work",
        {"personal": (0, 30), "work": (20, 40), "personal2": (0, 10)},
        disabled=("personal2",),
    )
    results["noneQualify"] = single_tick(
        "none-qualify", "personal2", {"personal": (85, 40), "work": (10, 65), "personal2": (96, 50)}
    )
    results["activeExhausted"] = single_tick(
        "active-exhausted", "personal", {"personal": (100, 90), "work": (10, 65), "personal2": (100, 50)}
    )

    manual = Scenario(
        "manual-revert",
        World(Clock(), "personal2", {"personal": (0, 30), "work": (20, 40), "personal2": (10, 10)}),
    )
    before = manual.tick()
    manual.world.active = SLOTS["work"]
    manual.world.clock.now += 400
    results["manualLowerTierReverted"] = [before, manual.tick()]

    unhealthy = Scenario(
        "three-unhealthy",
        World(
            Clock(),
            "personal2",
            {"personal": (0, 30), "work": (20, 40), "personal2": None},
            errors={"personal2": "http-500"},
        ),
    )
    ticks = []
    for _ in range(3):
        ticks.append(unhealthy.tick())
        unhealthy.world.clock.now += 60
    results["threeUnhealthyTicks"] = ticks

    unreadable = Scenario(
        "no-readable-candidate",
        World(
            Clock(),
            "personal2",
            {"personal": None, "work": None, "personal2": None},
            errors={"personal": "http-500", "work": "http-500", "personal2": "http-500"},
        ),
    )
    ticks = []
    for _ in range(3):
        ticks.append(unreadable.tick())
        unreadable.world.clock.now += 60
    results["noReadableCandidate"] = ticks

    results["unreadableCandidate"] = single_tick(
        "unreadable-candidate",
        "personal2",
        {"personal": None, "work": None, "personal2": (95, 50)},
        errors={"personal": "http-500", "work": "http-500"},
    )

    quarantine = Scenario(
        "authentication-quarantine",
        World(
            Clock(),
            "personal2",
            {"personal": (90, 40), "work": (20, 40), "personal2": (95, 50)},
            dead_logins=("work",),
        ),
    )
    results["authenticationQuarantine"] = quarantine.tick()
    state = json.loads((quarantine.root / "autoswitch_state.json").read_text(encoding="utf-8"))
    assert SLOTS["work"] in state.get("quarantine", {}), state
    assert quarantine.switcher.switch_calls == [], quarantine.switcher.switch_calls

    results["stale429"] = {
        **single_tick(
            "stale-429",
            "personal2",
            {"personal": (0, 30), "work": (20, 40), "personal2": (50, 50)},
            errors={"personal2": "http-429"},
            stale=("personal2",),
        ),
        "acceptedLimitation": "stale last-good usage can delay a line departure",
    }

    json.dump(
        {
            "claudeSwap": version("claude-swap"),
            "policy": {"tiers": TIERS, "lines": LINES},
            "scenarios": results,
        },
        sys.stdout,
        sort_keys=True,
    )
    sys.stdout.write("\n")


if __name__ == "__main__":
    try:
        main()
    finally:
        shutil.rmtree(SANDBOX, ignore_errors=True)
