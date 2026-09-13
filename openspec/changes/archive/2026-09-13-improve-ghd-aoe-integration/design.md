## Context

See [proposal.md](proposal.md) for the motivation and scope. The implementation crosses the gh-dash commands, Worktrunk handoff, AoE lifecycle and the existing Claude PATH shim, so a design artifact is required.

AoE 1.14.0 was inspected and exercised with an isolated profile and rejecting tmux/Claude stubs:

- `aoe add` deduplicates by title and project path, ignores group in that comparison, and returns before launch when it finds a duplicate. Changing only the title creates another session. [Versioned add implementation](https://raw.githubusercontent.com/njbrake/agent-of-empires/v1.14.0/src/cli/add.rs).
- Startup retains `extra_args` before appending conversation flags. Captured arguments were `["/review-team", "owner/repo#123", "--session-id", "<new-uuid>"]` on first launch and `["/review-team", "owner/repo#123", "--resume", "<existing-uuid>"]` on resume. AoE supplies `AOE_PROFILE` and `AOE_INSTANCE_ID`. [Versioned instance implementation](https://raw.githubusercontent.com/njbrake/agent-of-empires/v1.14.0/src/session/instance.rs).
- The supported CLI can list groups/sessions, show session details and start an ID, but cannot edit a session's persisted `extra_args`.
- The Claude shim already preserves project Node activation and delegates to the real Claude executable by absolute path.

The user's exact `f` failure was not reproduced. The AoE part of repeated `F` was reproduced: exit 0, an existing-session message, and no launch request. Local-branch Worktrunk reuse also succeeded; an incomplete mocked GitHub PR response is not evidence of the user's failure.

## Goals / Non-Goals

**Goals:**

- Make display metadata independent of durable session identity.
- Keep lifecycle decisions in one helper and preserve explicit conversation identity when both modalities share a worktree.
- Enforce model-output and latency constraints in code, with isolated behavior tests.
- Make interrupted registration recoverable while keeping AoE's internal state under AoE's ownership.

**Non-Goals:**

- Replace Worktrunk's worktree manager, introduce another LLM provider or change the reviewers in `review-team.md`.
- Automatically migrate all existing titles/groups or adopt arbitrary manual sessions by title alone.
- Guarantee transactional exactly-once delivery across a crash during the first Claude startup. The contract is to omit the bootstrap instruction when resuming an existing conversation.
- Diagnose the unidentified `f` error by speculation or launch real review agents as part of automated validation.

## Decisions

### 1. Use a shared executable with argument-based process calls

Install `ghd-aoe` from `dot_local/bin/executable_ghd-aoe`. Both bindings pass repository path, full repository identity, PR number and modality. Use Bun for the helper's JSON, filesystem and subprocess handling, with no additional package dependency; keep the existing shim POSIX shell. Any support module must be installed alongside the helper by chezmoi and imported by the behavior tests.

The helper owns the Worktrunk handoff and AoE operations. It uses `wt -C <repo-path> switch pr:<N>` and the supported execution handoff to obtain the actual worktree, preserving current hook behavior and avoiding a guessed worktree path. It fetches PR title, body and head branch via `gh pr view --json`. Reused valid sessions skip naming inference. All process arguments are passed as argument arrays or safely quoted fixed handoff tokens; PR prose never becomes shell source.

Keeping logic in the two YAML strings was rejected because it duplicates state, quoting and error handling. A shell-only helper would require more manual JSON and process-lifecycle plumbing.

### 2. Store identity and naming choices outside AoE

Use `${XDG_STATE_HOME:-~/.local/state}/ghd-aoe/`, scoped by AoE profile and full repository/PR identity. A per-PR record contains the shared base title/group and separate normal/review associations. Each association records the AoE ID, canonical worktree path, modality, expected bootstrap reference and known launch/conversation state. Include the GitHub host in repository identity when available, so equal owner/repository names on different hosts cannot collide.

Persist only the metadata needed for reuse and launch control, not PR bodies or model transcripts. Write records atomically and restrict state-file access to the user. Resolve the selected profile once and pass it consistently to AoE, inference inputs and marker lookup.

A title-based lookup alone was rejected because titles can change and collide. Editing `sessions.json` was rejected because the running TUI also owns and writes that state.

### 3. Serialize per PR and recover pending registrations

Hold a per-profile/repository/PR lock across naming selection and registration. The lock must cover both modalities because they share naming metadata. Release it on failure; reclaim only demonstrably abandoned locks and never evict a live operation solely because it is old.

Write a pending creation intent containing the target worktree, modality and exact display metadata before calling AoE. After registration, resolve and persist the new ID before any launch. If the process was interrupted, reconcile that intent with AoE's current JSON session list; adopt only one unambiguous match. This closes the usual gap between AoE registration and recording its ID.

Check stored IDs against the active profile and worktree before reuse. Recover old shortcut sessions using their exact legacy `pr owner/repo#N` or `review owner/repo#N` title plus canonical worktree path, never title alone. Preserve those legacy display values. A recovered legacy session without a generated naming choice does not become an excuse to rename it: the first new naming choice is generated when needed for a new modality. Subsequent newly named sessions share that choice.

If recovery is ambiguous, return a diagnostic instead of choosing an arbitrary conversation. Best-effort creation without a lock or pending intent was rejected because rapid keypresses and interrupted processes would still create duplicate sessions.

### 4. Use one short Haiku request and normalize locally

Invoke the existing authenticated Claude Code executable with `-p --model haiku`, no tools, safe mode, no persisted session and thinking disabled. Use the real CLI path for this metadata-only call so project Node discovery or a cold nvm install does not consume the inference budget. The prompt requests the group and title together from repository name, live group paths and PR title/body/head branch.

Request a JSON object and parse it as data. Accept a single enclosing Markdown JSON fence, then require the expected string fields. Validate selected groups against the current group list or a humanized form of the repository slug. Normalize title whitespace, strip an accidental review prefix, bound it to four words and enforce first-letter-only capitalization. Reject unusable content and use fallback; never evaluate a generated command.

Use an end-to-end inference deadline measured from process startup. Cancel the process and its descendants at ten seconds without adding a fixed post-timeout grace period. Do not retry. Metadata-fetch and Worktrunk failures have separate diagnostics; when PR metadata is unavailable but Worktrunk can still resolve the PR, use the specified `Pull request N` fallback without inference. Also use that generic English fallback if the available source title cannot be used as an English label; do not spend another model request on translation after a failure.

A CLI call with `--json-schema` was considered, but the exploratory measurements showed additional model turns and still required local formatting checks. Prompt-only output with explicit local parsing and normalization keeps the request short while enforcing the same observable contract. Direct API integration was rejected because the existing Claude authentication is already available.

Exploratory benchmark on 2026-09-07, twelve sequential fresh CLI calls using two actual dotfiles PRs and one synthetic new-group case:

| Variant | Calls | Completed within 10 s | Valid before local repair |
| --- | ---: | ---: | ---: |
| Initial prompt JSON | 3 | 3 | 0 |
| Initial schema with string fields | 3 | 3 | 2 |
| Revised prompt JSON | 3 | 1 | 0 |
| Revised schema with word-count constraint | 3 | 2 | 2 |

Completed calls took 3.040–7.093 seconds. Three calls reached the deadline. One captured prompt response had a JSON fence and five title words; the earlier raw prompt outputs were not preserved, so their exact formatting failures are unknown. Schema calls could take two or three turns. Process cleanup added up to 1.137 seconds after timeout in the exploratory harness, which the production deadline handling must avoid. GitHub metadata reads took 0.738 and 0.808 seconds separately.

This small changing-prompt sample is not a percentile estimate or a reliability claim. Preserve a reproducible, opt-in benchmark in the implementation; normal tests use stubs.

### 5. Separate registration from review startup

For normal mode, register without launch. For review mode, also register without launch, then persist the AoE association and review marker before calling `aoe session start <id>`. New sessions explicitly use the Claude tool and the installed shim path so interception is reliable. A running session is left alone; a stopped session resumes by ID.

Read structured session/conversation details instead of treating the stored `idle` or displayed `error` status as proof that a review has or has not started: the isolated queued fixture appeared as `error` when no tmux session existed. Record launch intent and observed conversation identity, and distinguish a failed first attempt from a previously started review whose transcript is now missing. Recheck at the launch boundary when AoE supplies its actual conversation flags.

Calling `aoe add -l` for both registration and reuse was rejected by the reproduced early-return defect. Calling `--continue` was rejected because normal and review sessions share a worktree and must not resume each other's conversations.

### 6. Filter only a registered review's bootstrap prompt on resume

Extend the existing Claude shim at its delegation boundary. Gate review handling by `AOE_PROFILE`, `AOE_INSTANCE_ID`, canonical worktree and an external managed-review marker. Unrelated Claude calls retain the current fast path.

When the actual launch has `--resume`, remove only the exact matching `/review-team` plus `owner/repo#N` pair, or its combined-argument representation. Preserve all other arguments and their boundaries. On a genuine first launch with `--session-id`, preserve the initial instruction. If the marker identifies an already started review and AoE unexpectedly supplies a fresh launch because its transcript disappeared, report failed resumption instead of silently reviewing again. Keep absolute delegation and the existing Node selection and exit-status behavior.

This also handles old shortcut sessions once they have been associated and marked, without changing their persisted AoE arguments. A global rule that strips every review prompt, or a general change to user Claude settings, would affect unrelated sessions and was rejected.

### 7. Keep documentation and existing contracts coherent

Use the four delta specs as the contract for implementation. The `agent-manager` change distinguishes user-triggered non-interactive management from automatic TUI startup. The `claude-node-launch` delta makes its argument exception explicit, including non-Node directories.

Update only the manual's `f` and `F` rows with the following replacement descriptions, retaining the surrounding HTML conventions:

```html
<tr>
    <td><kbd>f</kbd></td>
    <td>
        Queue or reuse the PR's AoE session (no launch). Haiku selects
        the project group and an English title of up to four words.
        New groups use a human-readable repository name. After a
        10-second timeout or inference failure, use a repo-based group
        and a short PR-title fallback.
    </td>
</tr>
<tr>
    <td><kbd>F</kbd></td>
    <td>
        Launch or resume the PR's AoE review team in the background
        as <code>Review - &lt;title&gt;</code>, sharing the normal
        session's group and base title. Reuses the conversation
        without repeating <code>/review-team</code>
        (3 agents; none post to the PR).
    </td>
</tr>
```

## Risks / Trade-offs

- [AoE CLI/schema drift] → Read supported JSON fields and lifecycle flags, test against the installed baseline and fail visibly on incompatible output instead of writing internal state.
- [Resume depends on reaching the shim] → Set its absolute command override for new sessions and verify PATH interception for legacy sessions before resuming them.
- [Model variability and service delays] → Normalize and validate locally, cache the first choice and honor the ten-second fallback boundary.
- [Concurrent creation or interrupted writes] → Per-PR locking, pending intents, atomic records and unambiguous reconciliation.
- [Transcript disappearance] → Preserve explicit conversation targets and reject a fresh launch for a review that must resume.
- [First-start crash timing] → Do not claim exactly-once bootstrap execution across arbitrary failures; keep a failed resumption visible and preserve the association for diagnosis.
- [The specific `f` error is unknown] → Verify the replacement route with isolated end-to-end fixtures and retain this limitation in validation notes without requiring another interview round.

## Migration Plan

1. Add the helper and isolated tests, then implement naming/state and the narrow shim behavior.
2. Switch the two bindings to the helper and apply the two manual descriptions above.
3. Validate the change specs, run focused Bun behavior tests, shell syntax checks and repository formatting checks. Verify the rendered chezmoi diff and installed helper/shim paths without starting real reviews.
4. Apply only the helper/support files, shim and gh-dash configuration when implementing the authorized rollout. Existing sessions are associated lazily on first reuse; no bulk title/group migration runs.
5. Roll back new shortcut behavior by restoring the previous bindings. Retain the managed-review resume filter, its support code and state until existing managed reviews are retired or deliberately migrated, so a rollback cannot reintroduce bootstrap replay for those sessions. Do not delete user sessions, worktrees or transcripts during rollback.

## Open Questions

- The exact message from the user's original `f` failure remains unavailable. This does not change the replacement behavior or implementation tasks; capture it only if it recurs during later use.
