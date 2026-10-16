# Tasks

## 1. Correct the dependency hook and cover its behavior

- [x] 1.1 Add `tests/worktrunk-install-deps.test.ts` with a harness that parses the actual TOML hook and executes it in an isolated temporary worktree with stub package managers and Node binaries; verify it reproduces the current false-success behavior and ambient-Node mismatch without real installs.
- [x] 1.2 Implement root `.nvmrc` selection in `dot_config/worktrunk/config.toml` before package-manager lookup: normalize numeric pins, honor custom/default nvm homes, select the highest usable matching version for partial pins, and warn/fall back for unresolved pins without sourcing nvm; verify exact/prefixed/CRLF/no-newline/major/minor pins, paths with spaces, absent/empty files, unusable versions, aliases, unchanged ambient fallback, and child Node selection with `bun test tests/worktrunk-install-deps.test.ts`.
- [x] 1.3 Propagate each install command's original nonzero status, log manager/status on failure, and reserve `[install-deps] done` for successful installs; verify success and forced failure for Bun, pnpm, and npm, log ordering, no-lockfile and missing-manager skips, and unchanged lockfile precedence in the hook test suite.
- [x] 1.4 Correct the stale `[post-start].deps` comment and apply the concrete section 5 manual row proposed in `design.md` within the authorized documentation scope, following `update-manual`; verify the final row explains Node fallback, background execution, log access, and distinct outcomes, and run `bun run lint:oxfmt`.

## 2. Validate integration and acceptance

- [x] 2.1 Run `bun test`, `bun run lint:oxfmt`, and `openspec validate fix-worktrunk-deps-install --strict --no-interactive`; verify all pass and the diff remains limited to the hook, its tests, manual, and this change's artifacts.
- [x] 2.2 Validate the candidate config through Worktrunk in an isolated fixture and force a known install failure with a stub manager; verify config loading succeeds, the hook exits with the injected status, its log contains no `done`, and record how Worktrunk exposes the background error separately from the foreground switch result.
- [x] 2.3 Verify the issue's real pnpm acceptance case in a disposable eci-av worktree with ambient Node 24 and installed Node 22.21.0: wait for the hook, confirm it selects 22.21.0, populates `node_modules`, and finishes with `done`; capture log evidence, or record the specific unavailable prerequisite and leave real-project acceptance outstanding.
- [x] 2.4 Smoke-check available iot, recupera, and grupo worktrees using the candidate hook and their Bun lockfiles; verify successful Bun installation and unchanged behavior without `.nvmrc`, recording results and any unavailable-project limitations rather than treating stub tests as real-project evidence.
