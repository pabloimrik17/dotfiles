## 1. Pin claude-swap 1.2.0

- [x] 1.1 Set `CLAUDE_SWAP_VERSION="1.2.0"` in `run_onchange_install-packages.sh.tmpl`, `dot_local/bin/executable_claude-swap-setup.tmpl` and `run_onchange_after_claude-swap-setup.sh.tmpl`; verify `rg -n 'CLAUDE_SWAP_VERSION="' --glob '*.tmpl'` shows only 1.2.0.
- [x] 1.2 Install the pin locally with the installer's command, `uv tool install --managed-python --force 'claude-swap[menubar]==1.2.0'`, then `cswap menubar --install-service` with no flag. Verify `cswap --version` reports 1.2.0, `cswap menubar --service-status` starts with `Menu bar service:`, and `cswap priority`/`cswap threshold` still list the runtime values.
- [x] 1.3 Update the installer tests in `tests/claude-swap.test.ts` (fresh install, exact pin, upgrade from 0.29.0 with service refresh, schema-v1 JSON, settings accepted by the 1.2.0 parser); verify `bun test tests/claude-swap.test.ts -t "pinned claude-swap installer|managed claude-swap policy"` passes.

## 2. Setup command: accounts

- [x] 2.1 In `executable_claude-swap-setup.tmpl`, require `personal`, `work` and `work2` on personal machines, and exactly `work` and `work2` on work machines. The compliance message accepts both work accounts. The first work enrollment ends on `work`. Verify with tests for the new completeness, the incomplete existing Mac that lacks `work2`, and non-compliant extras (`personal2`, unaliased) on a work machine.
- [x] 2.2 Allow `--enroll work2` and `--reauth work2` on both machine types, keep `personal2` personal-only, and update `USAGE`. Verify with tests for enroll and reauth on both types, rejections, the previous-account restore, and adopting an unaliased current login as `work2` in place.
- [x] 2.3 Remove the `--reauth` hold-out restore (`disable` after `add --slot`) and its comment. Verify the "keeps a held-out account out of rotation across --reauth" test passes with no `disable` in the command log and the fake reflecting upstream's #358 behaviour.

## 3. Setup command: rotation policies and activation

- [x] 3.1 Replace `ROTATION_POLICY` with `ROTATION_POLICY_PERSONAL="personal2:100:95 work:50:70 work2:50:70 personal:10:80"` and `ROTATION_POLICY_WORK="work:50:95 work2:50:95"`, chosen by `MACHINE_TYPE`. Apply them on both machine types in setup and `--apply-policy`, skipping accounts that are not enrolled. Verify the rotation-policy tests: per-type values, a missing `work2`/`personal2`, drift convergence, and `--apply-policy` on a work machine.
- [x] 3.2 Run the dry run on both machine types. Pass `--auto-switch` to `cswap menubar --install-service` only on the run that enrolled the last missing required account, and use no flag elsewhere. Update the final guidance lines (no menu-toggle instruction; mention the menu pause). Verify with tests: the completing run on each type logs `auto --once --dry-run` before `menubar --install-service --auto-switch`; repair, `--reauth` and `--enroll personal2` runs log no flag.
- [x] 3.3 Follow the experiments:writing-comments skill for any comment touched in the setup and offer scripts. Verify the diff adds no narrative comments.

## 4. Post-apply offer

- [x] 4.1 In `run_onchange_after_claude-swap-setup.sh.tmpl`:
  - extract both `ROTATION_POLICY_PERSONAL` and `ROTATION_POLICY_WORK` lines by regex, failing the render if either is missing;
  - run `--apply-policy` on both machine types;
  - bump `SETUP_COMMAND_REVISION` to 3;
  - reference both values in the trailing no-op.

  Verify with offer tests: the render fails without either line, a value change alters the rendered hash, a work machine runs `--apply-policy`, and the complete/incomplete/TTY paths are unchanged.

## 5. Autoswitch fixture on the 1.2.0 engine

- [x] 5.1 Rebuild `tests/fixtures/claude-swap-autoswitch.py` on the 1.2.0 engine, reusing `simulation/harness.py`'s fake switcher (`disabled_account_numbers`, `switch_to(force)`). Cover the scenarios of the account-policy delta spec:
  - personal tier order with `work2` and sooner-reset-first within the work tier;
  - line departure and no landing above a line on both types;
  - blocked when nothing qualifies;
  - a manual choice reverted, including within the work tier;
  - three unhealthy ticks;
  - stale-429;
  - work accounts held out on the personal machine.

  Verify `bun test tests/claude-swap.test.ts -t "upstream claude-swap autoswitch policy"` passes against cswap 1.2.0.

## 6. Documentation

- [x] 6.1 Update Section 11 of `docs/manual.html` with the update-manual skill, following the manual-web delta spec:
  - `work2` enrollment;
  - both trial policies with their values and the simulation reference;
  - autoswitch activation on both types, and the pause;
  - the heavy-week hold-out and the ×1.5 limit;
  - `--reauth work2`;
  - removal of the "work Mac keeps only `work`, autoswitch off" text.

  Verify the section order is unchanged and `bun test` covers any manual checks.
- [x] 6.2 Check `README.md` with the update-readme skill and change its claude-swap summary only if it names the old policy or the single work account. Verify with `rg -n -i 'claude-swap|cswap' README.md`.
- [x] 6.3 Confirm that `GLOSSARY.md` has the work-account, rotation-policy, reserve, surplus, wall and switch-line wording agreed in the grill, with no implementation details. Verify that `GLOSSARY.md` is still listed in `.chezmoiignore.tmpl`.

## 7. Simulation artifacts and integration

- [x] 7.1 Keep the `simulation/` folder committed with only `README.md`, the scripts, `log-weekly-stats.py`, `results.json`, `summary*.txt` and `.gitignore`. Verify with `git status --porcelain openspec/changes/add-work2-rotation-policies/simulation` that no `.venv/`, `runs/`, `results/`, `home/` or `__pycache__/` file is staged.
- [x] 7.2 Run the full gates: `openspec validate add-work2-rotation-policies --strict`, `bun test`, and `bunx fallow audit`. Verify all pass.
- [x] 7.3 Render both machine types with `chezmoi execute-template` on the setup and offer templates, once with `machineType` personal and once with work. Verify the selected `ROTATION_POLICY_*` line, the pin, and the revision.

## Workflow follow-up

- Open a PR from `feat/agentic-task-v4sb-work2-rotation-policies`; after merge, run `chezmoi update` on the personal Mac, then on the work Mac, and follow design.md, Migration Plan.
- Verify on both Macs: `cswap priority`, `cswap threshold`, `cswap auto --once --dry-run`, and the menu health row.
- Archive the change after review; close Beads `agentic-task-v4sb`.
- Trial review after real weeks: `python3 -I simulation/log-weekly-stats.py ~/.claude-swap-backup/claude-swap.log <(cswap list --json)` against the design's D9 criteria. A retune goes through a new change.
