"""Exercise claude-swap's real autoswitch engine with isolated fake accounts."""

from __future__ import annotations

import json
import sys
import tempfile
from dataclasses import dataclass
from importlib.metadata import version
from pathlib import Path

from claude_swap.autoswitch import AutoSwitchEngine, TickOutcome
from claude_swap.settings import AutoSwitchSettings


@dataclass
class FakeUsageEntry:
    last_error: str | None = None


class FakeSwitcher:
    def __init__(self, backup_dir: Path) -> None:
        self.backup_dir = backup_dir
        self.active = "1"
        self.emails = {"1": "active@example.invalid", "2": "peer@example.invalid"}
        self.switch_calls: list[str] = []

    def set_poll_policy_inputs(self, threshold: float, models: tuple[str, ...]) -> None:
        self.poll_policy = (threshold, models)

    def current_account_number(self) -> str:
        return self.active

    def has_live_login(self) -> bool:
        return True

    def account_email(self, number: str | None) -> str:
        return self.emails.get(number or "", "")

    def account_kind_for(self, number: str) -> str:
        return "oauth"

    def switchable_account_numbers(self) -> list[str]:
        return ["1", "2"]

    def read_account_credentials(self, number: str, email: str) -> str:
        return f"non-secret fixture credential for slot {number}"

    def switch_to(self, number: str, json_output: bool = False) -> dict:
        self.switch_calls.append(number)
        previous = self.active
        self.active = number
        return {
            "switched": True,
            "from": {
                "number": int(previous),
                "email": self.account_email(previous),
            },
            "to": {"number": int(number), "email": self.account_email(number)},
            "warnings": [],
        }


def usage_for(headroom: float | None) -> dict | None:
    if headroom is None:
        return None
    return {
        "five_hour": {"pct": 100.0 - headroom},
        "seven_day": {"pct": 0.0},
    }


class ScenarioEngine(AutoSwitchEngine):
    def __init__(
        self,
        switcher: FakeSwitcher,
        headroom: dict[str, float | None],
        events: list,
        *,
        dry_run: bool = True,
        state_path: Path,
        last_errors: dict[str, str] | None = None,
        freshen_status: dict[str, str] | None = None,
        clock=lambda: 1_000.0,
    ) -> None:
        self.scenario_headroom = headroom
        self.scenario_usage = {number: usage_for(value) for number, value in headroom.items()}
        self.scenario_entries = {
            number: FakeUsageEntry((last_errors or {}).get(number)) for number in headroom
        }
        self.scenario_freshen_status = freshen_status or {}
        super().__init__(
            switcher,
            AutoSwitchSettings(
                threshold=85.0,
                interval_seconds=60.0,
                cooldown_seconds=300.0,
                hysteresis_pct=10.0,
                strategy="best",
                include_api_key_accounts=False,
                unhealthy_ticks=3,
                model=None,
            ),
            events.append,
            dry_run=dry_run,
            state_path=state_path,
            clock=clock,
        )

    def _collect_scheduled_usage(
        self,
        current: str,
        quarantined: set[str] = frozenset(),
        *,
        threshold: float | None = None,
    ) -> tuple[dict, dict, dict[str, float | None]]:
        return self.scenario_entries, self.scenario_usage, self.scenario_headroom

    def _freshen_target(self, number: str, email: str) -> str:
        return self.scenario_freshen_status.get(number, "ok")


def event_payloads(events: list) -> list[dict]:
    return [event.to_json() for event in events]


def assert_event(events: list[dict], kind: str, **fields: object) -> dict:
    for event in events:
        if event.get("event") == kind and all(event.get(key) == value for key, value in fields.items()):
            return event
    raise AssertionError(f"missing {kind} event with {fields}: {events}")


def run_scenario(
    root: Path,
    name: str,
    headroom: dict[str, float | None],
    *,
    dry_run: bool = True,
    last_errors: dict[str, str] | None = None,
    freshen_status: dict[str, str] | None = None,
    seed_state: dict | None = None,
) -> tuple[TickOutcome, list[dict], Path, FakeSwitcher, ScenarioEngine]:
    scenario_root = root / name
    scenario_root.mkdir()
    state_path = scenario_root / "autoswitch_state.json"
    if seed_state is not None:
        state_path.write_text(json.dumps(seed_state), encoding="utf-8")
    switcher = FakeSwitcher(scenario_root)
    events: list = []
    engine = ScenarioEngine(
        switcher,
        headroom,
        events,
        dry_run=dry_run,
        state_path=state_path,
        last_errors=last_errors,
        freshen_status=freshen_status,
    )
    outcome = engine.tick()
    return outcome, event_payloads(events), state_path, switcher, engine


def main() -> None:
    results: dict[str, object] = {}
    with tempfile.TemporaryDirectory(prefix="claude-swap-autoswitch-") as temp:
        root = Path(temp)

        outcome, events, _, _, _ = run_scenario(
            root, "threshold", {"1": 15.0, "2": 35.0}
        )
        assert outcome is TickOutcome.SWITCHED
        assert_event(events, "switch", trigger="proactive", dryRun=True)
        results["threshold"] = outcome.name

        outcome, events, _, _, _ = run_scenario(
            root, "all-above-threshold", {"1": 4.0, "2": 14.0}
        )
        assert outcome is TickOutcome.SWITCHED
        assert_event(events, "switch", trigger="proactive", dryRun=True)
        results["allAboveThreshold"] = outcome.name

        outcome, events, _, _, _ = run_scenario(
            root, "hysteresis", {"1": 15.0, "2": 24.0}
        )
        assert outcome is TickOutcome.BLOCKED
        assert_event(events, "no-switch", reason="no-qualifying-candidate")
        results["hysteresis"] = outcome.name

        outcome, events, _, _, _ = run_scenario(
            root,
            "cooldown",
            {"1": 15.0, "2": 35.0},
            seed_state={"schemaVersion": 1, "lastSwitchAt": 900.0},
        )
        assert outcome is TickOutcome.NO_ACTION
        assert_event(events, "no-switch", reason="cooldown")
        results["cooldown"] = outcome.name

        outcome, events, _, _, _ = run_scenario(
            root, "all-exhausted", {"1": 0.0, "2": 0.0}
        )
        assert outcome is TickOutcome.BLOCKED
        assert_event(events, "all-exhausted", earliestResetAt=None)
        results["allExhausted"] = outcome.name

        outcome, events, _, _, _ = run_scenario(
            root, "recovered-inactive", {"1": 20.0, "2": 90.0}
        )
        assert outcome is TickOutcome.NO_ACTION
        assert_event(events, "no-switch", reason="below-threshold")
        results["recoveredInactive"] = outcome.name

        scenario_root = root / "three-unhealthy-ticks"
        scenario_root.mkdir()
        switcher = FakeSwitcher(scenario_root)
        unhealthy_events: list = []
        unhealthy_engine = ScenarioEngine(
            switcher,
            {"1": None, "2": 50.0},
            unhealthy_events,
            state_path=scenario_root / "autoswitch_state.json",
        )
        unhealthy_outcomes = [unhealthy_engine.tick() for _ in range(3)]
        unhealthy_payloads = event_payloads(unhealthy_events)
        assert unhealthy_outcomes == [
            TickOutcome.NO_ACTION,
            TickOutcome.NO_ACTION,
            TickOutcome.SWITCHED,
        ]
        assert_event(unhealthy_payloads, "no-switch", reason="active-usage-unknown")
        assert_event(unhealthy_payloads, "switch", trigger="failover", dryRun=True)
        results["threeUnhealthyTicks"] = [item.name for item in unhealthy_outcomes]

        outcome, events, _, _, _ = run_scenario(
            root, "unreadable-candidate", {"1": 15.0, "2": None}
        )
        assert outcome is TickOutcome.BLOCKED
        assert_event(events, "no-switch", reason="no-comparison")
        results["unreadableCandidate"] = outcome.name

        outcome, events, state_path, switcher, _ = run_scenario(
            root,
            "authentication-quarantine",
            {"1": 15.0, "2": 35.0},
            dry_run=False,
            freshen_status={"2": "invalid_grant"},
        )
        assert outcome is TickOutcome.BLOCKED
        assert_event(
            events,
            "account-quarantined",
            number="2",
            reason="invalid_grant",
        )
        state = json.loads(state_path.read_text(encoding="utf-8"))
        assert state["quarantine"]["2"]["reason"] == "invalid_grant"
        assert switcher.switch_calls == []
        results["authenticationQuarantine"] = outcome.name

        outcome, events, _, _, _ = run_scenario(
            root,
            "stale-429",
            {"1": 20.0, "2": 50.0},
            last_errors={"1": "http-429"},
        )
        assert outcome is TickOutcome.NO_ACTION
        assert_event(events, "no-switch", reason="below-threshold")
        assert not any(event["event"] == "switch" for event in events)
        results["stale429"] = {
            "outcome": outcome.name,
            "acceptedLimitation": "stale last-good usage can delay a threshold switch",
        }

    json.dump(
        {"claudeSwap": version("claude-swap"), "scenarios": results},
        sys.stdout,
        sort_keys=True,
    )
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
