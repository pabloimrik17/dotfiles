## 1. Shared helper and isolated CLI fixtures

- [x] 1.1 Add the chezmoi-managed Bun helper entry point and any installed support module, validating repository identity, PR number, modality and paths; verify its argument contract with `bun test tests/ghd-aoe.test.ts`.
- [x] 1.2 Add isolated GitHub, Worktrunk, AoE and Claude fixtures that cannot start real sessions; reproduce the legacy repeated-`F` case where duplicate registration requests no launch and capture that expected failure.
- [x] 1.3 Implement Worktrunk PR handoff and JSON PR-metadata retrieval without interpolating PR prose into shell commands; verify new/existing worktrees, quoted paths and a Worktrunk failure that prevents AoE registration.

## 2. Group and title selection

- [x] 2.1 Add one authenticated Haiku CLI request for group and base title using live group paths and PR title/body/head branch; verify the captured invocation disables tools, personalizations and persistence and receives the intended metadata without a diff.
- [x] 2.2 Implement JSON parsing, optional enclosing-fence removal, group validation/humanization and local title normalization; verify existing groups, a new `My cool project` group, English sentence case, acronym lowering, accidental prefixes and the four-word maximum.
- [x] 2.3 Enforce the ten-second inference deadline from CLI startup, including cancellation of subprocesses without a fixed extra cleanup delay or retry; verify the timeout fixture reaches fallback and leaves no inference child running.
- [x] 2.4 Implement deterministic fallback for model/auth/format failure and missing PR metadata; verify normalized repository-group matching, Conventional Commits prefix removal, short PR-title fallback and generic `Pull request N` for absent or unusable English titles, with the review prefix when applicable.

## 3. Durable identity and reuse

- [x] 3.1 Add atomic per-profile/repository/PR state with independent modality IDs and one shared naming choice, storing no PR bodies or transcripts; verify persistence, profile/repository isolation and user-only file access.
- [x] 3.2 Resolve stored IDs against current AoE JSON state before reuse and preserve existing titles/groups/conversations; verify repeated `f` makes no registration, inference or launch request and title collisions never select another PR.
- [x] 3.3 Reuse the first naming choice when creating the other modality; verify both creation orders produce the same group/base title, separate IDs and no second Haiku request.
- [x] 3.4 Add per-PR serialization and pending creation intents with interruption recovery; verify simultaneous invocations converge on one session per modality and an interrupted registration is recovered without another session.
- [x] 3.5 Recover stale associations and unambiguous legacy title/worktree matches while preserving their existing display metadata; verify missing IDs, exact legacy matches, unrelated sessions and an ambiguity that reports an error without creating a duplicate.

## 4. Review startup and conversation resumption

- [x] 4.1 Separate review registration from startup, persisting its association and managed marker before `aoe session start`; verify the first launch receives the selected PR's `/review-team` instruction and goes through the installed Claude shim.
- [x] 4.2 Implement existing-review lifecycle decisions using process/conversation evidence rather than one status label; verify running reviews receive no restart, stopped reviews resume the same conversation and never-started registrations receive their first instruction.
- [x] 4.3 Extend the shim with managed-review identity/worktree checks and exact bootstrap removal on `--resume`; verify separate and combined prompt arguments, unrelated arguments with spaces/quotes, mismatched identities and genuine first launches in `bun test tests/claude-node-launch.test.ts`.
- [x] 4.4 Preserve the shim's absolute delegation, exit status and project Node behavior; verify installed-version activation, non-Node passthrough and unmanaged Claude invocations alongside the managed-review cases.
- [x] 4.5 Track known launch/conversation state and reject a fresh replacement for a previously started review whose transcript is missing; verify no bootstrap is replayed, no `--continue` is substituted and failed startup retains a usable association with an explicit diagnostic.

## 5. Bindings, documentation and rendering

- [x] 5.1 Replace the two inline AoE commands with the shared helper and accurate help labels; verify rendered `f` queues, `F` starts/resumes in the background, neither attaches to the TUI and delegated calls never add `--trust-hooks`.
- [x] 5.2 Apply the two manual row replacements specified in design decision 7, preserving the surrounding HTML; verify the diff documents naming, grouping, the ten-second fallback and reuse behavior consistently with the bindings.
- [x] 5.3 Inspect the targeted chezmoi diff for the helper/support files, Claude shim and gh-dash configuration; verify the intended target paths and executable bits are rendered and no unrelated configuration is included.

## 6. Integration verification and rollout

- [x] 6.1 Run the focused Bun CLI/shim suite across naming, both creation orders, repeated invocations, concurrency, interrupted recovery, hostile metadata and failed resume; verify the original repeated-`F` regression now requests the correct existing session startup and all contract assertions pass.
- [x] 6.2 Preserve an opt-in reproducible Haiku benchmark using the final inference path and the exploratory results recorded in the design; verify it reports startup-inclusive duration, output validity, deadline/fallback and cleanup without creating AoE sessions.
- [x] 6.3 Run shell syntax checks for the shim, `bun run lint:oxfmt` and `openspec validate improve-ghd-aoe-integration --strict --no-interactive`; record passing results and the remaining limitation that the user's original `f` error text was never available.
- [x] 6.4 After the behavior and configuration checks pass, apply only the helper/support files, shim and gh-dash configuration; verify installed executable paths, helper imports and shim interception without launching a review or changing live AoE session records.

## Validation notes

- Focused behavior suite: 38 tests pass across the helper, isolated CLI fixtures, Claude shim, benchmark and rendered bindings.
- Shell syntax, `bun run lint:oxfmt`, `git diff --check` and strict OpenSpec validation pass.
- The scoped chezmoi apply installed only the helper/support module, Claude shim and gh-dash configuration; installed files match their rendered sources and the live AoE session listing was unchanged.
- Remaining limitation: the exact text of the user's original `f` error was never available.
