"""Exercise claude-swap's real autoswitch engine against the repository policies.

Settings come from the managed settings.json, and tiers and lines from the
setup template's ROTATION_POLICY_PERSONAL and ROTATION_POLICY_WORK. Accounts,
usage and the clock are fakes; HOME is a temporary directory and
network/subprocess calls are refused. The fake switcher is copied from the
simulation harness of change add-work2-rotation-policies: sequence-derived
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
from claude_swap.autoswitch import AutoSwitchEngine
from claude_swap.settings import load_settings
from claude_swap.switcher import ClaudeAccountSwitcher
from claude_swap.usage_store import UsageEntry

assert SANDBOX in paths.get_backup_root().resolve().parents, paths.get_backup_root()
autoswitch.random.random = lambda: 0.5

NOW = datetime(2026, 11, 4, 18, 0, tzinfo=timezone.utc).timestamp()
HOUR = 3600.0
DAY = 86400.0
# Personal-Mac slot numbers are the real ones; the work Mac enrolls work first.
SLOTS = {
    "personal": {"work": "1", "personal": "2", "personal2": "3", "work2": "4"},
    "work": {"work": "1", "work2": "2"},
}
# Days to each weekly reset: work before work2, as on the real accounts.
WEEKLY_RESET_DAYS = {"work": 1.0, "personal": 2.0, "work2": 3.0, "personal2": 4.0}


def iso(timestamp: float) -> str:
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat().replace("+00:00", "Z")


def declared_policy(machine: str) -> dict[str, dict]:
    name = f"ROTATION_POLICY_{machine.upper()}"
    match = re.search(rf'^{name}="([^"]*)"$', SETUP_TEMPLATE.read_text(), re.M)
    assert match, f"{name} is missing from the setup template"
    tiers: dict[str, int] = {}
    lines: dict[str, float] = {}
    for entry in match.group(1).split():
        alias, tier, line = entry.split(":")
        tiers[alias] = int(tier)
        lines[alias] = float(line)
    return {"tiers": tiers, "lines": lines}


POLICY = {machine: declared_policy(machine) for machine in SLOTS}
for machine, policy in POLICY.items():
    assert set(policy["tiers"]) == set(SLOTS[machine]), (machine, policy)


class Clock:
    def __init__(self) -> None:
        self.now = NOW

    def __call__(self) -> float:
        return self.now


class World:
    def __init__(
        self,
        machine: str,
        active: str,
        usage: dict[str, tuple[float, float] | None],
        *,
        disabled: tuple[str, ...] = (),
        errors: dict[str, str] | None = None,
        stale: tuple[str, ...] = (),
        dead_logins: tuple[str, ...] = (),
        reset_days: dict[str, float] | None = None,
    ) -> None:
        self.clock = Clock()
        self.slots = SLOTS[machine]
        self.names = {number: name for name, number in self.slots.items()}
        self.policy = POLICY[machine]
        self.active = self.slots[active]
        self.usage = usage
        self.disabled = set(disabled)
        self.errors = errors or {}
        self.stale = set(stale)
        self.dead_logins = set(dead_logins)
        self.reset_days = {**WEEKLY_RESET_DAYS, **(reset_days or {})}

    def sequence(self) -> dict:
        accounts = {}
        for name in self.usage:
            record = {
                "email": f"{name}@example.invalid",
                "organizationUuid": "",
                "alias": name,
                "priority": self.policy["tiers"][name],
                "threshold": self.policy["lines"][name],
            }
            if name in self.disabled:
                record["disabled"] = True
            accounts[self.slots[name]] = record
        ordered = sorted(self.usage, key=lambda name: int(self.slots[name]))
        return {"sequence": [int(self.slots[name]) for name in ordered], "accounts": accounts}

    def usage_payload(self, name: str) -> dict | None:
        windows = self.usage[name]
        if windows is None:
            return None
        five, seven = windows
        return {
            "five_hour": {"pct": five, "resets_at": iso(self.clock() + 2 * HOUR)},
            "seven_day": {
                "pct": seven,
                "resets_at": iso(self.clock() + self.reset_days[name] * DAY),
            },
        }


class FakeSwitcher:
    _disabled_from_data = staticmethod(ClaudeAccountSwitcher._disabled_from_data)
    _policy_from_data = staticmethod(ClaudeAccountSwitcher._policy_from_data)
    switchable_account_numbers = ClaudeAccountSwitcher.switchable_account_numbers
    disabled_account_numbers = ClaudeAccountSwitcher.disabled_account_numbers
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
        name = self.world.names.get(number)
        return f"{name}@example.invalid" if name else ""

    def account_kind_for(self, number: str) -> str:
        return "oauth"

    def live_session_pids_for(self, number: str, email: str) -> list:
        return []

    def read_account_credentials(self, number: str, email: str) -> str:
        if self.world.names[number] in self.world.dead_logins:
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
            entries[self.world.slots[name]] = UsageEntry(
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

    def switch_to(self, number: str, json_output: bool = False, force: bool = False) -> dict:
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

    def state(self) -> dict:
        return json.loads((self.root / "autoswitch_state.json").read_text(encoding="utf-8"))

    def manual_switch(self, name: str, *, after: float) -> None:
        self.world.active = self.world.slots[name]
        self.world.clock.now += after

    def tick(self) -> dict:
        start = len(self.events)
        outcome = self.engine.tick()
        events = self.events[start:]
        switches = [event for event in events if event["event"] == "switch"]
        if switches:
            return {
                "outcome": outcome.name,
                "to": self.world.names[str(switches[-1]["to"]["number"])],
                "trigger": switches[-1]["trigger"],
            }
        reasons = [
            event.get("reason") or event["event"]
            for event in events
            if event["event"] in ("no-switch", "all-exhausted", "account-quarantined", "error")
        ]
        return {
            "outcome": outcome.name,
            "active": self.world.names[self.world.active],
            "reasons": reasons,
        }

    def ticks(self, count: int) -> list[dict]:
        results = []
        for _ in range(count):
            results.append(self.tick())
            self.world.clock.now += 60
        return results


class Machine:
    def __init__(self, machine: str) -> None:
        self.machine = machine

    def scenario(self, name: str, active: str, usage: dict, **kwargs) -> Scenario:
        seed_state = kwargs.pop("seed_state", None)
        return Scenario(
            f"{self.machine}-{name}",
            World(self.machine, active, usage, **kwargs),
            seed_state=seed_state,
        )

    def tick(self, name: str, active: str, usage: dict, **kwargs) -> dict:
        return self.scenario(name, active, usage, **kwargs).tick()


def personal_scenarios() -> dict[str, object]:
    machine = Machine("personal")
    results: dict[str, object] = {}
    fresh = {"personal": (0, 30), "work": (20, 40), "work2": (20, 40), "personal2": (0, 10)}
    work_full = {"work": (10, 72), "work2": (10, 75)}

    results["higherTierUsable"] = machine.tick("higher-tier", "work", fresh)
    results["cooldown"] = machine.tick(
        "cooldown", "work", fresh, seed_state={"schemaVersion": 1, "lastSwitchAt": NOW - 100}
    )
    results["lineDeparture"] = machine.tick(
        "line-departure", "personal2", {**fresh, "personal2": (95, 50)}
    )
    results["weeklyLineDeparture"] = machine.tick(
        "weekly-line-departure", "personal2", {**fresh, "personal2": (50, 95)}
    )
    results["soonerResetFirst"] = machine.tick(
        "sooner-reset-first",
        "personal2",
        {**fresh, "personal2": (95, 50)},
        reset_days={"work": 3.0, "work2": 1.0},
    )
    results["workAboveLineSkipped"] = machine.tick(
        "work-above-line",
        "personal2",
        {**fresh, **work_full, "personal": (40, 40), "personal2": (95, 50)},
    )
    results["restartKeepsWork"] = machine.tick(
        "restart-keeps-work",
        "work",
        {**fresh, "personal": (0, 0), "personal2": (96, 50)},
        seed_state={"schemaVersion": 1, "lastSwitchAt": NOW - HOUR, "lastSwitchTo": "1"},
    )
    results["heldOut"] = machine.tick("held-out", "work", fresh, disabled=("personal2",))
    results["heldOutMovesOn"] = machine.tick(
        "held-out-moves-on",
        "work",
        {**fresh, "work": (10, 72)},
        disabled=("personal2",),
    )
    results["workHeldOut"] = machine.tick(
        "work-held-out",
        "personal2",
        {**fresh, "work": (0, 0), "work2": (0, 0), "personal2": (95, 50)},
        disabled=("work", "work2"),
    )
    results["workHeldOutStays"] = machine.tick(
        "work-held-out-stays",
        "personal",
        {**fresh, "work": (0, 0), "work2": (0, 0), "personal2": (95, 50)},
        disabled=("work", "work2"),
    )
    results["manualHeldOutWorkLeft"] = machine.tick(
        "manual-held-out-work",
        "work",
        {**fresh, "personal2": (95, 50)},
        disabled=("work", "work2"),
    )
    results["noneQualify"] = machine.tick(
        "none-qualify",
        "personal2",
        {"personal": (85, 40), "work": (10, 70), "work2": (70, 10), "personal2": (96, 50)},
    )
    results["activeExhausted"] = machine.tick(
        "active-exhausted",
        "personal",
        {**work_full, "personal": (100, 90), "personal2": (100, 50)},
    )

    manual = machine.scenario("manual-revert", "personal2", {**fresh, "personal2": (10, 10)})
    before = manual.tick()
    manual.manual_switch("work", after=400)
    results["manualLowerTierReverted"] = [before, manual.tick()]

    results["threeUnhealthyTicks"] = machine.scenario(
        "three-unhealthy",
        "personal2",
        {**fresh, "personal2": None},
        errors={"personal2": "http-500"},
    ).ticks(3)
    results["noReadableCandidate"] = machine.scenario(
        "no-readable-candidate",
        "personal2",
        dict.fromkeys(fresh),
        errors=dict.fromkeys(fresh, "http-500"),
    ).ticks(3)
    results["unreadableCandidate"] = machine.tick(
        "unreadable-candidate",
        "personal2",
        {"personal": None, "work": None, "work2": None, "personal2": (95, 50)},
        errors=dict.fromkeys(("personal", "work", "work2"), "http-500"),
    )

    quarantine = machine.scenario(
        "authentication-quarantine",
        "personal2",
        {**fresh, "personal2": (95, 50)},
        dead_logins=("work",),
    )
    results["authenticationQuarantine"] = {
        **quarantine.tick(),
        "quarantined": sorted(
            quarantine.world.names[number] for number in quarantine.state().get("quarantine", {})
        ),
    }
    assert quarantine.switcher.switch_calls == [SLOTS["personal"]["work2"]], (
        quarantine.switcher.switch_calls
    )

    results["stale429"] = {
        **machine.tick(
            "stale-429",
            "personal2",
            {**fresh, "personal2": (50, 50)},
            errors={"personal2": "http-429"},
            stale=("personal2",),
        ),
        "acceptedLimitation": "stale last-good usage can delay a line departure",
    }
    return results


def work_scenarios() -> dict[str, object]:
    machine = Machine("work")
    results: dict[str, object] = {}
    fresh = {"work": (10, 40), "work2": (10, 40)}
    work2_sooner = {"work": 3.0, "work2": 1.0}

    results["soonerResetConsumedFirst"] = machine.tick(
        "sooner-reset", "work", fresh, reset_days=work2_sooner
    )
    results["cooldown"] = machine.tick(
        "cooldown",
        "work",
        fresh,
        reset_days=work2_sooner,
        seed_state={"schemaVersion": 1, "lastSwitchAt": NOW - 100},
    )
    results["soonerResetActiveStays"] = machine.tick("sooner-active", "work", fresh)
    results["lineDeparture"] = machine.tick(
        "line-departure", "work", {**fresh, "work": (95, 40)}
    )
    results["weeklyLineDeparture"] = machine.tick(
        "weekly-line-departure", "work", {**fresh, "work": (40, 95)}
    )
    results["bothAboveLines"] = machine.tick(
        "both-above", "work", {"work": (95, 50), "work2": (30, 95)}
    )
    results["activeExhausted"] = machine.tick(
        "active-exhausted", "work", {"work": (100, 90), "work2": (96, 50)}
    )

    manual = machine.scenario("manual-revert", "work", fresh)
    before = manual.tick()
    manual.manual_switch("work2", after=400)
    results["manualWithinTierReverted"] = [before, manual.tick()]

    results["threeUnhealthyTicks"] = machine.scenario(
        "three-unhealthy", "work", {**fresh, "work": None}, errors={"work": "http-500"}
    ).ticks(3)
    return results


def main() -> None:
    json.dump(
        {
            "claudeSwap": version("claude-swap"),
            "policy": POLICY,
            "scenarios": {"personal": personal_scenarios(), "work": work_scenarios()},
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
