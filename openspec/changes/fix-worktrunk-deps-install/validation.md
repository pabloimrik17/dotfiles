# Validation evidence

## Regression checks

The initial tests reproduced both defects against the original hook: pnpm's
child resolved ambient v24.0.0 despite the 22.21.0 pin, and each manager's injected
exit 37 was replaced with exit zero. The initial run had 3 passes and 4 failures.

The Node-selection implementation passed all 21 focused checks. The final full hook
suite passed: 34 tests, 147 assertions, zero failures. It covers all three
managers, failures, skips, precedence, and fallback.
Two tests initially exceeded Bun's five-second default while subprocess startup
was slow; the fixture suite now uses the existing repository convention of a
30-second timeout. The machine subsequently reached load averages above 130;
15 seconds also proved insufficient for some shell processes.

## Repository checks

- `bun test`: 161 passed, 1 skipped, 13 failed during the high-load run.
  All 13 failures were 15-second timeouts in the unchanged ghd-aoe suite;
  all 34 new hook tests passed within this full run too.
- `bun test tests/ghd-aoe.test.ts` retry: 32 passed; all 13 original failures
  passed. One different test (`uses deterministic fallback for malformed output
  and model failure`) timed out at 15 seconds.
- A targeted retry of that remaining test passed in 10.36 seconds (7 assertions).
  Every non-skipped test passed across the full run and targeted retries. A
  clean single-pass full-suite result was not obtained under the machine load;
  no unrelated test or implementation was changed to obtain these results.
- `bun run lint:oxfmt`: passed.
- `openspec validate fix-worktrunk-deps-install --strict --no-interactive`: passed.
- `git diff --check`: passed. Changes are limited to the Worktrunk hook and
  adjacent comment, its test file, the Worktrees manual row, and this change's
  artifacts.

## Worktrunk integration (2026-10-16)

Tested with Worktrunk v0.77.0 in a temporary Git repository and isolated HOME.
The candidate user config was copied unchanged into that HOME. The only package
manager available for the fixture's bun.lock was a stub returning 37.

- `wt config show --format=json`: exit zero, candidate config loaded.
- `wt config update --output -`: exit zero, no output or migration proposed.
- `wt switch --create forced-failure --no-cd --yes`: exit zero, created the
  worktree and launched post-start in the background.
- The hook log discovered through `wt config state logs --format=json` contained:

```text
[install-deps] detecting package manager…
[install-deps] detected bun → installing
injected-install-failure
[install-deps] bun install failed (exit 37)
```

There was no completion marker. Worktrunk's separate post-start runner log said:

```text
✗ command failed with exit code 37: install-deps
```

Running `wt hook post-start user:install-deps --foreground` also printed
`Command install-deps failed: exit status: 37`, and its command-log entry recorded
`"exit":37`. The Worktrunk CLI itself nevertheless returned zero. Thus neither
foreground CLI status nor the asynchronous switch result substitutes for the
hook's actual status/log outcome. The same failure result was also verified
with the caller's SHELL set to /bin/zsh.

## Real-project acceptance prerequisites

The exact original-machine acceptance remains outstanding. The user confirmed
these projects live on another machine and authorized monolab and
daily-agentic-task-force as local substitutes. Stub tests are not real-install
evidence; the local substitutes below used real package managers.

- No eci-av, iot, recupera, or grupo checkout was found in WebstormProjects,
  Developer, Projects, Documents, Desktop, apps, or scratch within the inspected
  project-directory depths. Spotlight also returned no matching checkout names.
- Default nvm installations are v20.12.2, v20.20.2, v22.14.0, and v24.18.0.
  Node 22.21.0 is absent. Active NVM_DIR is the default ~/.nvm and ambient
  Node reports v24.18.0.
- No real eci-av pnpm install or iot/recupera/grupo Bun install was attempted.
  Their checkout locations and, for eci-av, installed Node 22.21.0 are needed to
  reproduce the original-machine cases. Tasks 2.3 and 2.4 allow recording
  unavailable-project limitations; the local substitutes also exercise real installs.

## Authorized local real-project substitutes

Both used disposable worktrees in temporary local shared clones, the unchanged
candidate config passed to Worktrunk, and background hooks launched by
`wt switch --create verify-deps --no-cd --yes`. Source checkouts were unchanged.

### daily-agentic-task-force

- Source HEAD: `7dfc8cb2a1e3e10d88af2604a16a7b03719e3e1e`.
- Ambient Node: `v24.18.0`; switch exit: 0.
- Populated root `node_modules`: 18 immediate entries.
- Hook completed successfully:

```text
[install-deps] detecting package manager…
[install-deps] detected bun → installing
bun install v1.4.2 (744846f84)

…

297 packages installed [3.92s]
[install-deps] done
```

No root `.nvmrc`: Bun installed 297 packages without Node-selection changes.

### monolab

- Source HEAD: `53900a8ca7b158e2a72f37f822ea5529f6048137`.
- Ambient Node: `v22.14.0`; switch exit: 0.
- Populated root `node_modules`: 35 immediate entries.
- Hook completed successfully:

```text
[install-deps] detecting package manager…
[install-deps] selected Node v24.18.0
[install-deps] detected pnpm → installing
Scope: all 25 workspace projects
…
apps/green-beard prepare: Done
Done in 1m 5.1s using pnpm v11.15.0
[install-deps] done
```

Root `.nvmrc` is 24.18.0. The hook selected that installed version before
pnpm 11.15.0, overriding ambient 22.14.0. With the selected PATH,
`pnpm exec node --version` in the installed worktree also returned v24.18.0.
