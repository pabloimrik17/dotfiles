## Context

User manages multiple parallel AI agent sessions and currently uses `claude agents` (Claude Code v2.1.150) ad-hoc, with no chezmoi declaration. A recent ecosystem of "agent session managers" offers divergent DX bets: native GUI (Conductor), tmux-centric TUI (Claude Squad), multi-piece architecture with web+mobile (Agent of Empires), plus the Claude Code built-in. Decision must be evidence-driven, not hype-driven.

**Relevant stack:** macOS (Apple Silicon), zsh, ghostty, tmux, worktrunk (git worktrees), Claude Code + OpenCode already configured. Heavy keyboard user.

**Constraints:**

- Final adoption MUST be versionable via chezmoi (consistent with the rest of the repo).
- A macOS-only winner MUST gate its chezmoi integration under `{{ if eq .chezmoi.os "darwin" }}`.
- No breaking changes: winner coexists with `claude agents` built-in.
- Trial budget: ~2-3h total.

## Goals / Non-Goals

**Goals:**

- Pick a winner from comparable DX evidence.
- Document the scoring rubric so the decision is reproducible / auditable.
- Pre-cook the 4 chezmoi integration patterns (one per candidate) so post-decision only the matching one needs execution.
- Capture re-evaluation triggers (what signals reopen this in 6–12 months).

**Non-Goals:**

- Evaluate tools outside the 4 candidates (AIR excluded per proposal).
- Build a custom agent manager.
- Migrate existing Claude Code workflows — winner is added, not a replacement.
- CI coverage of the trial (manual and subjective by design).

## Decisions

### D1: Synthetic probes on a scratch repo (no real tasks)

Real tasks bias toward the tool where the user already has context loaded. Identical synthetic probes give apples-to-apples comparison.

**Setup**: `~/scratch/agent-trial-repo` — minimal Node repo with (a) `src/calc.js` containing an intentional `multiply()` bug, (b) a broken test, (c) an incomplete `README.md`.

**The 5 probes**:

| #      | Probe                  | Exact prompt / action                                                                                                                                    | Measures                                              |
| ------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **S1** | Dispatch fluency       | _"Fix the bug in src/calc.js — multiply() returns sum instead of product"_ (1 task, 1 agent)                                                             | Time-to-first, startup mental model, keyboard fluency |
| **S2** | Concurrency visibility | Parallel dispatch: (a) "Add JSDoc to all functions in src/", (b) "Write 3 unit tests for calc.js", (c) "Rename variable `foo` to `total` in src/calc.js" | Status panel, switching, "who's awaiting input?"      |
| **S3** | Multi-output compare   | Same prompt to Claude + OpenCode (or 2 Claude instances if multi-provider isn't supported): _"Refactor calc.js to ES modules"_                           | Side-by-side DX, picking an output                    |
| **S4** | Disconnect & resume    | Long prompt: _"Generate full README with badges, install, usage, API table"_ → quit app/terminal → reopen                                                | True persistence, attach/resume DX                    |
| **S5** | Review & iterate       | On the S1 output: review diff, inline-comment _"add a guard for non-numeric input"_, merge                                                               | Diff/merge DX, last-mile                              |

**Rejected alternative**: real dotfiles tasks → too much contextual bias.

### D2: 1-5 rubric filled POST-probe (not pre-probe)

Filling the matrix before touching the tool imports marketing bias. The rubric is filled after running each probe in each tool, with free-form notes ("what hurt", "what surprised me").

**Axes (10)** taken from prior research:

1. Time-to-first-task
2. Mental model clarity
3. Status visibility across sessions
4. Side-by-side output compare
5. Persistence (terminal close / machine restart)
6. Diff/merge review of agent outputs
7. Notifications (idle/done)
8. Cross-device (web/mobile/sync)
9. Keyboard fluency
10. Onboarding ramp

**Result table** (filled post-trial): 4 tools × 10 axes = 40 cells.

### D3: Weighted-sum decision with explicit tiebreakers

Plain sum misleads when axes carry different weight for the user. Suggested weights (mutable before the trial, frozen after):

| Axis                 | Weight |
| -------------------- | ------ |
| Time-to-first-task   | 1.0    |
| Mental model         | 1.5    |
| Status visibility    | 2.0    |
| Side-by-side compare | 1.0    |
| Persistence          | 1.5    |
| Diff/merge           | 2.0    |
| Notifications        | 0.5    |
| Cross-device         | 0.5    |
| Keyboard fluency     | 1.5    |
| Onboarding           | 0.5    |

**Ordered tiebreakers** (if top-2 diff < 2 points):

1. Worktrunk integration viability (see D5)
2. Cross-platform (favors non-macOS-only)
3. Project maturity (avoid preview/beta when possible)
4. Cost (free wins ties)

### D4: 4 pre-cooked chezmoi integration patterns

To avoid waiting for the trial, document NOW how each candidate would integrate. Post-decision, only the matching pattern is executed.

#### Pattern A — `claude agents` (Claude Code built-in)

**chezmoi integration**: _none_. Claude Code is already on `BREW_PACKAGES` (verify formula name). `claude agents` is a subcommand — no new binary, no own config.

**Action items**: none; this pattern is a no-op in chezmoi. The `agent-manager` capability is satisfied by declaring that `claude` is managed by `cli-tool-expansion` (or equivalent) and that `claude agents` is accessible with no extra steps.

**Risk**: depends on the installed Claude Code version. Pin a minimum version requirement (v2.1.139+).

#### Pattern B — Conductor (macOS GUI, cask) — VERIFIED

**chezmoi integration**: `conductor` cask exists in `homebrew/cask` (verified via `brew info --cask conductor`). Added as an entry in the existing `ALL_CASKS` array of the install script. Gated to arm64 Darwin via `{{ if and (eq .chezmoi.os "darwin") (eq .chezmoi.arch "arm64") }}` because Conductor requires Apple Silicon. No Conductor config files managed by chezmoi (per-workspace `.env` bootstrap stays out of scope — documented as manual step in the migration plan, mirroring HN-flagged friction).

**Action items**:

- `ALL_CASKS` += `"conductor|Conductor|AI|Claude code parallelisation"`.
- Apple Silicon gate via the chezmoi template `arch` check (Conductor requires AS — verified by its app, not by the cask declaration).
- Per-workspace `.env` bootstrap: manual; documented in `tasks.md` rather than the script.

**Risk**: Conductor reinstalls on every arm64 Darwin host. If the user wants to differentiate between two arm64 Macs (own this one yes, other no), a hostname-based gate would be required. Accepted scope: Conductor on all arm64 Macs.

#### Pattern C — Claude Squad (TUI brew)

**chezmoi integration**: add `claude-squad` to `BREW_PACKAGES`. Optional `cs` symlink. No tap (formula in homebrew-core, verify). Config under `dot_config/claude-squad/` if applicable.

**Action items**:

- `BREW_PACKAGES` += `claude-squad`.
- `pkg_bin "claude-squad"` → `claude-squad` (identity mapping).
- Closing summary includes `claude-squad`.
- Prereqs (`tmux`, `gh`) already covered by `cli-tool-expansion`.
- AGPL-3.0: note in docs (irrelevant for personal use).

**Risk**: low. Pattern identical to `mole-install` and friends.

#### Pattern D — Agent of Empires (TUI brew with moving parts) — VERIFIED

**chezmoi integration**: `aoe` is in `homebrew-core` (verified via `brew info aoe` → stable 1.9.5, MIT, deps `tmux`+`openssl@3`). No tap needed. Docker NOT made mandatory in the spec — documented as opt-in (sandboxing). Config does NOT go under `dot_config/aoe/`: AoE reads `~/.agent-of-empires/config.toml` on macOS, breaking the `~/.config/` convention. Chezmoi target: `private_dot_agent-of-empires/config.toml`.

**Action items**:

- `BREW_PACKAGES` += `aoe`.
- `pkg_bin "aoe"` → `aoe` (identity mapping, no dedicated `case` arm).
- Closing summary line updated.
- Docker documented as optional (sandboxing only).
- Chezmoi-managed `private_dot_agent-of-empires/config.toml` with deliberately chosen knobs (theme, default tool, status hooks via `terminal-notifier`, tmux integration disabled, update check off — see D8 for the full set).
- Worktrunk integration: see D5 (deferred/out-of-scope).

**Risk**: medium. Web=Beta and Cockpit=Alpha → don't enable them via chezmoi yet; TUI only. Config path on macOS unverified at source-code level (docs claim `~/.agent-of-empires/`); resolve via `aoe init` on a clean state before committing.

### D5: Worktrunk integration — deferred/out-of-scope

**Original assumption (wrong)**: AoE's `agent-override` could delegate worktree creation. Verified against AoE source: `agent-override` only swaps the agent command, not the worktree-creation step. AoE always calls `git worktree add` directly from its own code (`src/git/worktree.rs`). No public hook.

**Wrapper-script workaround considered and rejected**. It was technically viable: pre-create the worktree via `wt switch --create`, then call `aoe add <path>` in attach-mode (no `-b`). AoE would detect the existing worktree by branch name and reuse it (`managed_by_aoe: false`), letting worktrunk own the lifecycle.

Reasons rejected for this change:

1. **Discipline burden** — works only when invoked via the wrapper. Bare `aoe` (and AoE's own UI to create sessions) falls back to native worktree creation; worktrunk hooks silently don't fire. Easy to bypass, hard to enforce.
2. **Maintenance overhead** — wrapper depends on stable `aoe add` CLI flags (`-w`, attach detection) and `wt list --json` output. Either upstream changes → broken wrapper.
3. **Scope creep** — solving worktrunk-aware AoE is a project, not a chezmoi entry. Deserves a dedicated change once upstream exposes a hook (e.g., `worktree_command` config knob).

**Current state**: AoE manages its own worktrees independently of worktrunk. Hooks like `worktrunk-config`'s `[pre-start].save-base` and `[post-start].install-deps` do NOT fire for AoE-created sessions. Acceptable for the trial winner's adoption; reopen as a follow-up change if:

- Upstream AoE adds a native delegation hook, OR
- The user reports recurring pain from worktrunk hooks not firing (e.g., missing `install-deps` on every new AoE session is felt enough times).

Viability snapshot for traceability:

| Tool             | Native worktree-delegation hook?                             |
| ---------------- | ------------------------------------------------------------ |
| `claude agents`  | ❌ No public hook                                            |
| Conductor        | ❌ Closed source                                             |
| Claude Squad     | ⚠️ Would require AGPL fork                                   |
| Agent of Empires | ❌ No native hook; wrapper-workaround deferred (this change) |

### D6: Specs and tasks are written POST-trial

`specs/agent-manager/spec.md` must name the concrete binary (per `mole-install` pattern), the exact `BREW_PACKAGES` entry, and the idempotency checks. Without a winner, that would be fiction. Same for implementation tasks.

**Workflow**:

1. Trial runs per D1–D3 (manual, outside OpenSpec).
2. Once the winner is picked, run `openspec instructions specs --change agent-management-strategy` and write the spec using the matching D4 pattern.
3. Run `openspec instructions tasks` and write implementation tasks.
4. Implement as usual (edit `run_onchange_install-packages.sh.tmpl`, etc).
5. Archive once everything is applied and verified on a clean machine (if possible).

**Rejected alternative**: write specs with placeholders → OpenSpec validates concrete scenarios; placeholders won't pass.

## Risks / Trade-offs

- **[Risk]** Synthetic probes don't capture real user flows.
  → **Mitigation**: after adopting the winner, validate with 1 week of real use before archiving.

- **[Risk]** The "winner" may shift in 6 months (very young ecosystem).
  → **Mitigation**: D7 (re-evaluation triggers, below).

- **[Risk]** Conductor + AoE TUIs scale in cognitive load (more concepts) — the rubric may under-represent this.
  → **Mitigation**: "Mental model clarity" weight raised to 1.5 in D3.

- **[Risk]** `claude agents` is Research Preview — adopt it and the UX may shift.
  → **Mitigation**: pin minimum version in the spec (v2.1.139+). If UX breaks, reopen this change.

- **[Trade-off]** Claude Squad's AGPL-3.0: irrelevant for personal dotfile use. Note, don't block.

- **[Trade-off]** Subjective trial: two users could land on different winners. Accepted: this change reflects user preference, not a universal "best tool".

## Migration Plan

1. **Pre-trial**: this change created, proposal and design written.
2. **Trial**: run the 5 probes against each candidate. Fill the DX matrix. Capture in `temp.txt` or a side note (not in OpenSpec yet).
3. **Decision**: apply D3 with weights. Break ties via D5 + D3 tiebreakers.
4. **Specs**: write `specs/agent-manager/spec.md` per the matching D4 pattern.
5. **Tasks**: write `tasks.md` covering: (a) update proposal if scope drifted, (b) edit `run_onchange_install-packages.sh.tmpl`, (c) `private_dot_agent-of-empires/config.toml`.
6. **Implementation**: execute tasks.
7. **Validation**: `openspec validate agent-management-strategy --strict` must now pass (deltas exist).
8. **Verification**: re-run install script idempotently → confirm `command -v <winner>` no longer triggers install.
9. **Archive**: `/opsx:archive agent-management-strategy`.

**Rollback**: if the tool feels worse in real use (week 1), revert the commit and reopen the trial with refined criteria. Nothing destructive is introduced — only additions.

## D7: Re-evaluation criteria

This decision is reopened if any of:

- A relevant new competitor lands (e.g., a mainstream-vendor tool — GitHub, Cursor, OpenAI — with clearly better DX).
- The winner becomes discontinued or low-maintenance (<1 release / 3 months).
- The user's provider stack shifts (e.g., dropping OpenCode, adopting a new provider unsupported by the winner).
- A relevant change in `worktrunk` opens or closes integration paths.
- The user reports recurring pain on specific probes during real use.

## D8: AoE config knobs to ship

Set deliberately in `private_dot_agent-of-empires/config.toml`:

| Key                            | Value                                                                                    | Rationale                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `[theme].name`                 | `tokyo-night-storm` or closest catppuccin variant AoE offers                             | Align with the rest of the stack's catppuccin-mocha                  |
| `[theme].color_mode`           | `truecolor`                                                                              | Ghostty supports it                                                  |
| `[session].default_tool`       | `claude`                                                                                 | Heaviest-use agent — saves a keystroke                               |
| `[session].agent_status_hooks` | `true`                                                                                   | Required for status column                                           |
| `[status_hooks].on_waiting`    | `terminal-notifier -title "aoe: $AOE_SESSION_TITLE" -message "needs input" -sound Glass` | Native notification — `terminal-notifier` already in `BREW_PACKAGES` |
| `[status_hooks].on_idle`       | `terminal-notifier -title "aoe: $AOE_SESSION_TITLE" -message "done"`                     | Idle notification                                                    |
| `[worktree].init_submodules`   | `false`                                                                                  | User doesn't use submodules; saves seconds per create                |
| `[tmux].status_bar`            | `disabled`                                                                               | User owns `~/.tmux.conf` with Catppuccin                             |
| `[updates].update_check_mode`  | `off`                                                                                    | Updates flow through brew + chezmoi                                  |
| `environment`                  | passthrough `CLAUDE_CONFIG_DIR`, `EDITOR`, `TERM`, `COLORTERM`                           | Agents need them                                                     |

Schema verification step in tasks: run `aoe init` on a clean state and diff against the proposed config; rename/drop unknown keys.

## Open Questions

- ~~Is Conductor available as a brew cask?~~ ✅ Verified: `conductor` cask exists in homebrew-cask.
- ~~Is `aoe` in homebrew-core?~~ ✅ Verified: `aoe` stable 1.9.5, no tap.
- Exact minimum Claude Code version that ships `claude agents`? — out of scope here; `claude agents` is not adopted into chezmoi as a separate item (it's a Claude Code subcommand; Claude Code itself is already chezmoi-managed elsewhere).
- AoE config path on macOS: docs claim `~/.agent-of-empires/`, not verified at source level. Resolve via `aoe init` on a clean state before committing chezmoi target path.
- Hostname-based gating for Conductor (current Mac vs the other Mac)? Decision: NOT gated by hostname; both arm64 Macs get Conductor via chezmoi.
- Pin version in `BREW_PACKAGES`? Decision: rolling-update (consistent with the rest of the repo).
