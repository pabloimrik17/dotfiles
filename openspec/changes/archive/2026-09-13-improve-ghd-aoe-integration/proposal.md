## Why

The gh-dash AoE shortcuts use repository/PR tokens as session names and put reviews into a separate `reviews/owner/repo` hierarchy, making the existing project groups harder to use. Repeating `F` also leaves an existing stopped review unstarted because AoE's duplicate check returns before launch; generated names require explicit session identity to avoid creating duplicates.

## What Changes

- Route `f` and `F` through a shared helper while retaining Worktrunk for PR worktrees: `f` queues a normal session, and `F` starts or resumes a review in the background.
- Use the existing authenticated Claude Code CLI with Haiku to choose an existing AoE group and a short English name from PR metadata in one request. Create a human-readable repository group when none fits.
- Share the group and base title between the normal and review sessions for a PR. Names have at most four words in sentence case; review sessions add the literal `Review - ` prefix.
- Reuse sessions by profile, full repository, PR number and modality, preserving their IDs, titles and conversations. Persist the association outside AoE's internal state and serialize concurrent invocations.
- Bound inference to ten seconds, validate and normalize model output locally, and use deterministic group/title fallbacks on failure.
- Resume stopped reviews without resending their initial `/review-team` command, using a narrowly scoped extension to the existing Claude launch shim.
- Update the manual's two shortcut descriptions and reconcile the existing specs that prohibit all scripted AoE calls or require unconditional argument passthrough.

## Capabilities

### New Capabilities

- `ghd-aoe-sessions`: Project grouping, PR-derived naming, stable session identity, shared naming choices, bounded inference, fallback and lifecycle behavior for sessions created through gh-dash.

### Modified Capabilities

- `gh-dash-keybindings`: Replace inline AoE commands and fixed names/groups with the shared helper, preserving queue/background behavior, Worktrunk routing and the existing hook-trust policy.
- `claude-node-launch`: Permit removal of the matching initial review prompt only when resuming a registered gh-dash review; retain Node selection, absolute delegation, unrelated arguments and exit status.
- `agent-manager`: Permit user-triggered non-interactive AoE management through the shortcuts while keeping the interactive TUI out of automatic startup and install flows.

## Impact

- Implementation files: a new `dot_local/bin/executable_ghd-aoe` helper and necessary support files, `dot_config/gh-dash/config.yml`, and `dot_local/bin/shims/executable_claude`.
- Documentation: `docs/manual.html` and the four capability specs above.
- Runtime state: a small XDG state index for PR/session associations and review launch markers; AoE's internal `sessions.json` remains owned by AoE.
- Existing tools: Worktrunk, AoE, GitHub CLI, Claude Code and the repository's Bun tooling. No new API credentials or model provider are required.
- Validation: isolated CLI/shim fixtures for reuse, concurrent calls, naming, timeout, fallback and argument handling. Preserve the exploratory Haiku benchmark results and the limitation that the user's exact `f` error was not reproduced.
