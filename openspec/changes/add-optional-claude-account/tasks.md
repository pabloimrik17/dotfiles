## 1. Repository hygiene

- [ ] 1.1 Add `GLOSSARY.md` and `tests/` to `.chezmoiignore.tmpl`. Verify that `chezmoi --source "$PWD" managed` no longer lists either of them, and that `openspec/`, `docs/` and `README.md` are still absent.

## 2. Pin 0.29.0

- [ ] 2.1 Bump `CLAUDE_SWAP_VERSION` to `0.29.0` in `run_onchange_install-packages.sh.tmpl`, `dot_local/bin/executable_claude-swap-setup.tmpl` and `run_onchange_after_claude-swap-setup.sh.tmpl`. Confirm that 0.29.0 was released at least one week earlier. Verify that the installer fake-command tests pass with the new pin, including the "upgrade from the previous pin" path (0.26.0 installed, menu service refreshed).
- [ ] 2.2 Re-verify the upstream contracts the setup depends on against the installed 0.29.0, and record the results in the test file: `list`/`status --json` keep `schemaVersion: 1`, `add --alias`/`--slot` behave as before, `--service-status` still starts with `Menu bar service:`, and `auto --once --dry-run` uses exit codes 0/2/3. Verify that the menubar `.app` wrapper is untracked: there is no chezmoi source entry for `/Applications/claude-swap Menubar.app`.

## 3. Setup: completeness and optional account

- [ ] 3.1 Make `setup_is_complete` depend only on the required aliases. On personal machines: `personal` and `work`, any account active, `personal2` allowed. On work machines, the existing constraint stays. Select `personal` only after a run that itself enrolled a missing required alias. Verify with fake-command tests that a complete setup with `work` or `personal2` active passes `--check` without a switch, and that a fresh personal enrollment ends on `personal`.
- [ ] 3.2 Add `--enroll personal2`, and allow `--reauth personal2`, on personal machines only. Both use the existing guided capture with the `/logout` warning. Reject them on work machines and reject unknown aliases. Verify with fake tests: capture into a new slot, recapture in the existing slot, work-machine rejection, and no output about `personal2` when it is absent or lapsed.
- [ ] 3.3 Record the active alias before any capture (`--enroll`, `--reauth`) and switch back to it afterwards. Verify with a fake test: with `work` active, `--reauth personal2` ends on `work`, and the command log contains no `switch personal`.
- [ ] 3.4 Keep `personal2` non-compliant on work machines through the existing unexpected-account path. Verify with a fake test that it gets removal guidance and that no `remove`/`disable` is issued.

## 4. Trial rotation policy

- [ ] 4.1 Update `private_dot_claude-swap-backup/private_settings.json`: `strategy: priority-consume-first`, `threshold: 85`, interval 60, cooldown 300, `hysteresisPct` 10, no API keys, `unhealthyTicks` 3, no `weeklyThreshold`, no `model`. Verify the managed-policy tests: rendered JSON, owner-only modes, drift convergence, and that the pinned `cswap config get` reads `autoswitch.strategy` = `priority-consume-first` and `autoswitch.weeklyThreshold` unset.
- [ ] 4.2 Declare the tiers (`personal2` 100, `work` 50, `personal` 10) and lines (`personal2` 95, `work` 60, `personal` 80) once in the setup template. Apply them with `cswap priority <alias> <tier>` and `cswap threshold <alias> <pct>`, for enrolled aliases only, on every personal-machine setup run. Verify with fake tests: the exact command sequence with and without `personal2`, no commands on a work machine, and a re-run that issues the same idempotent commands without re-enrolling.
- [ ] 4.3 Add a non-interactive `claude-swap-setup --apply-policy` mode that applies only tiers and lines and never prompts, captures or switches. Run it from `run_onchange_after_claude-swap-setup.sh.tmpl` before the completeness offer, with the declared values in the script's hash inputs, and bump `SETUP_COMMAND_REVISION`. Verify with offer-script tests that a value change re-applies without a prompt in both TTY and non-TTY runs, and that a work machine runs nothing.
- [ ] 4.4 Rebuild `tests/fixtures/claude-swap-autoswitch.py` on the 0.29.0 engine, reusing the simulator's in-memory `sequence.json` fake switcher. Cover the policy matrix:
  - a higher tier becomes usable;
  - departure at a line;
  - `work` above its line is skipped;
  - no account qualifies (BLOCKED, stays on the active account);
  - a manual lower-tier choice is reverted on the next tick;
  - three unhealthy ticks;
  - an unreadable candidate;
  - authentication quarantine;
  - the stale-429 limitation.

  Update the engine test in `tests/claude-swap.test.ts` to expect `0.29.0` and the new matrix. Verify `bun test tests/claude-swap.test.ts`.

## 5. Documentation

- [ ] 5.1 Read `.agents/skills/update-manual/references/html-conventions.md`. Update the claude-swap subsection of Section 11 of `docs/manual.html` to cover:
  - optional `personal2` (`--enroll`, `--reauth`, and disable in unpaid months);
  - the trial rotation, with its tiers, lines, the "lines are not caps" note and the simulation link https://claude.ai/artifact/6TgAbxVLuaYbFj3Psick5k, marked owner-private;
  - pausing Auto-switch for deliberate `work` sessions (Fable);
  - `--apply-policy`.

  Verify the manual-web scenarios and the existing documentation tests (15 sections, Section 11 unchanged).
- [ ] 5.2 Check the claude-swap summary in `README.md` against `.agents/skills/update-readme/references/readme-conventions.md`. Change it only if it names the old 85 % policy or the two-account setup. Verify the README documentation test still passes.

## 6. Validation and acceptance

- [ ] 6.1 Run `bun run lint:oxfmt`, `bun test tests/claude-swap.test.ts tests/claude-node-launch.test.ts tests/ghd-aoe.test.ts` and `openspec validate add-optional-claude-account --strict`. Fix every failure.
- [ ] 6.2 On the personal Mac:
  - preview with `chezmoi diff`, then apply;
  - confirm `cswap --version` is 0.29.0 and the menu service is running;
  - confirm `cswap priority` and `cswap threshold` list the declared values;
  - optionally enroll `personal2`;
  - run `cswap auto --once --dry-run`;
  - confirm `claude-swap-setup --check` exits 0 whichever account is active.

  Record the evidence in the Beads task `agentic-task-tsvi`.
- [ ] 6.3 Audit the source and rendered targets for credentials, `sequence.json`, `menubar_settings.json`, `autoswitch_state.json`, caches, plist or app-wrapper copies. Verify that Git contains only the public policy and that `simulation/` contains no results or `.venv`.

## Workflow follow-up

- Tell the user that `~/tests` is a stale leak they can remove by hand, after checking that its contents match the repository's `tests/`.
- Run the trial: the user reports real-use feedback. Analyse `~/.claude-swap-backup/claude-swap.log` with `simulation/log-weekly-stats.py` against the trial criteria in `design.md`, then open a follow-up change to retune the tiers and lines.
- Archive this change after review and verification.
