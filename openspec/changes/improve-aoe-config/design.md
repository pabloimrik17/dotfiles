## Context

Builds on `agent-management-strategy`, which adopted Agent of Empires (`aoe` 1.9.5) and shipped a deliberately minimal `private_dot_agent-of-empires/private_config.toml` (34 lines). Stack: macOS (Apple Silicon primary), ghostty (truecolor, `clipboard-read = ask`, `copy-on-select = clipboard`), tmux with a hand-owned `~/.tmux.conf` (Catppuccin Mocha, `mouse on`, no `set-clipboard`/`allow-passthrough`), worktrunk (`wt` 0.55.0) for worktrees, Claude Code + OpenCode as agents, chezmoi-managed dotfiles. Claude Code agent teams are enabled (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `settings.json`).

Two concrete defects motivate the SHIP items: (1) `[tmux].clipboard` defaults to `auto`, a no-op when a user `~/.tmux.conf` exists, so OSC 52 select-to-copy from wrapped agents is silently swallowed; (2) AoE injects 5 session-status hooks into `~/.claude/settings.json` — a chezmoi-managed template — so `chezmoi apply` clobbers them (live file is reformatted/sorted, ~110 lines vs the 34-line source). The TRIAL items revisit deferred features (theme, sound, lazygit tool-session, gh-dash integration, writeback thrash).

## Goals / Non-Goals

**Goals:**
- Fix the clipboard and status-hook defects; version the AoE→Claude integration so it reproduces on a new machine.
- Keep the config keyboard-first, worktrunk-aware, private (0600), and low-thrash.
- Add a frictionless gh-dash → AoE "queue without opening" flow, reusing the existing `wt switch pr:N -x …` pattern.
- Keep trial items reversible: build, soak, keep-or-prune before archive.

**Non-Goals:**
- Web dashboard, remote phone access, Cockpit/ACP mode (network/Node/beta — rejected with triggers in proposal).
- Global AoE worktree automation (`[worktree].enabled`) — bypasses worktrunk hooks.
- OpenCode session status in the AoE fleet (AoE injects no OpenCode hooks today; Claude-only is in scope).
- Linux support (parent change is macOS-gated; `terminal-notifier`-based hooks are macOS-only).

## Decisions

### D1: Clipboard fix via `[tmux].clipboard = "enabled"` (not tmux.conf edits)

AoE's `enabled` runs `set-clipboard on` + `allow-passthrough on` on every aoe tmux session. Chosen over adding those two lines to `dot_tmux.conf` because it scopes the change to aoe-managed sessions and keeps `~/.tmux.conf` authoritative elsewhere. Verified safe against the stack: ghostty `clipboard-write` is unset → defaults to `allow` (OSC 52 *write* path works); `clipboard-read = ask` is left untouched (read still prompts — matches the documented security posture). `allow-passthrough` lets the inner agent emit escape sequences to the outer terminal — acceptable since the agent already runs code locally; no network.

Also pin `[tmux].mouse = "disabled"` for determinism (the user owns `mouse on`), mirroring the existing `status_bar = "disabled"` rationale rather than relying on `auto` presence-detection.

### D2: Bake AoE status hooks into `settings.json.tmpl` as literal, self-gating JSON

AoE injects 5 hooks (`UserPromptSubmit`/`PreToolUse`/`ElicitationResult` → `running`, `Notification` matcher `permission_prompt|elicitation_dialog` → `waiting`, `Stop` → `idle`), each `sh -c '[ -n "$AOE_INSTANCE_ID" ] || exit 0; … printf <status> > /tmp/aoe-hooks/$AOE_INSTANCE_ID/status …'`. Add them verbatim to the template's `hooks` block alongside the existing `bd prime` hooks.

Rationale: they self-gate on `$AOE_INSTANCE_ID` (no-op outside aoe sessions → zero impact on normal Claude usage) and contain no machine-specific paths, so they template as literal JSON. This ends the tug-of-war (AoE writes → `chezmoi apply` removes → AoE re-injects) and makes the status column work on a fresh machine from the first `aoe`.

Alternatives rejected: (a) let AoE keep re-injecting — fragile, breaks on every apply, perpetual diff noise; (b) `.chezmoiignore` the hooks — can't partially ignore keys inside a managed template. This is a delta on `claude-hooks`.

### D3: `config.toml` writeback — `modify_` merge via tomlkit (style-preserving)

The settings.json and config.toml writeback problems are **opposite**: settings.json hooks are deterministic and wanted → bake them in (D2); config.toml writeback (`[app_state]`/`[web]`/`[cockpit]`/`[logging]` + default-expanded tables, ~76 extra lines) is runtime state we do NOT want to version → preserve it.

Decision: replace the static `private_dot_agent-of-empires/private_config.toml` with a chezmoi `modify_` script (`private_dot_agent-of-empires/modify_private_config.toml`). chezmoi pipes the live `~/.agent-of-empires/config.toml` to the script's stdin; the script overlays only the deliberately-managed keys and emits the merged file to stdout. The `modify_private_` prefix keeps the target `0600`.

- **Engine: `uv run --with tomlkit python`.** `uv` is already in `BREW_PACKAGES` (zero new brew dep); it fetches/caches `tomlkit` ephemerally. tomlkit is **style-preserving**: `dumps(parse(x)) == x` byte-for-byte, verified against the real live config. This is what delivers the explicit "`chezmoi diff` is quiet" goal — after AoE rewrites the file (new `app_state`, etc.) the merge round-trips every untouched table identically, so only genuinely-changed managed keys ever diff. (Re-evaluated and rejected: `dasel`/`yq` and any full-reserialize engine re-canonicalize formatting → recurring diff on every AoE rewrite; that defeated the goal. The original 1.5 verdict "no TOML tool on PATH → static fallback" is superseded: tomlkit-via-uv needs no new dep.)
- **Overlay-by-key + check-then-set.** A `MANAGED` list of `(table-path → value)` — the full set the old static file declared (`[theme]`/`[session]`/`[worktree]`/`[tmux]`/`[updates]`/`[status_hooks]`/`[sandbox]`/`[sound]`/`[tools.lazygit]`). Each key is set **only if its current value differs** — skip-if-equal preserves AoE's exact byte formatting (no churn). `[status_hooks]` commands are written as literal (single-quote) strings to match AoE. Everything else (`[app_state]`/`[web]`/`[cockpit]`/`[logging]` + default-expansions) passes through untouched.
- **No key loss on conversion.** `MANAGED` is a verified superset of the deleted static file's keys (17/17 captured, values identical). It becomes the single source of truth for managed values; changing a managed key means editing `MANAGED`.
- **Fallback.** Empty stdin (fresh machine, no live file) → emit a baseline of just the managed keys (AoE expands the rest on first launch). `uv` absent (cold start before the brew bootstrap) → pass stdin through unchanged (or baseline if empty); the next `chezmoi apply` self-heals.
- **Idempotent**, preserves `0600`. Verified on the real live config: A (1:1 round-trip), B (`merge(merge(x)) == merge(x)`), C (`[app_state]`/`[web]`/`[cockpit]`/`[logging]` preserved).

This is part of the `agent-manager` delta — its "preserves runtime writeback" requirement is now **built**, not deferred.

### D4: gh-dash bindings — worktrunk-first, queue-without-open

Both `a` and `r` reuse the existing pattern `wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x '<cmd>'`. `wt switch -x` is an `exec` (replaces the wt process, full terminal control); since `aoe add` without `-l/--launch` returns immediately, control returns to gh-dash with the session queued — exactly the "fill the fleet, open later" behavior.

- **Worktrunk-first (Option B) over aoe-native (`aoe add -w {{.HeadRefName}}`)**: worktrunk creates the worktree so its pre/post-start hooks fire (copy-ignored, install-deps, save-base, `.claude` settings sync), `pr:N` resolves fork PRs robustly, and deps are installed — which the `r` review team needs (`/verify` runs the app, `/code-review` runs typecheck/tests). aoe-native would skip all of that.
- **Prompt passing via `--`**: `wt … -x 'aoe add . … --extra-args' -- "<prompt>"` — worktrunk appends post-`--` args to the exec command and POSIX-escapes them, avoiding nested-quote fragility for the long review prompt.
- **`r` review team**: initial prompt instructs the lead to spin up 3 agents (teams already enabled) running `/code-review:code-review`, `/code-review`, and `/verify`, none posting to the PR, all reporting in-session; grouped under `reviews/{{.RepoName}}`.
- **`--trust-hooks` omitted**: `r` reviews untrusted PRs; auto-trusting a repo's `.agent-of-empires/` hooks would run unreviewed code. Accept a possible interactive trust prompt instead (verify it doesn't hard-block the non-interactive `-x`).
- **No uppercase tmux variant**: the existing lowercase/uppercase = direct/tmux pattern doesn't apply — `aoe add` returns instantly, so there's nothing interactive to split into a pane. The `gh-dash-keybindings` delta must reconcile that pattern requirement (queue bindings are a new class).

### D5: `agent-manager` sequencing dependency

`agent-manager` is defined by the in-progress `agent-management-strategy` change and is NOT in `openspec/specs/` yet. A MODIFIED delta needs the base capability present. Decision: gate the `agent-manager` spec delta on `agent-management-strategy` being archived/synced first (it is in its 1-week soak); the `claude-hooks` and `gh-dash-keybindings` deltas have no such dependency and can be written/validated independently. If the parent stalls, fall back to co-sequencing (sync `agent-manager` via `/opsx:sync` before this change's specs phase). Rejected: redefining AoE config as a brand-new capability here — would duplicate/conflict with `agent-manager`.

### D6: Theme — `catppuccin-mocha` custom (TRIAL) vs keep `tokyo-night-storm`

AoE ships no Catppuccin **dark** built-in (only `catppuccin-latte`, light). Option: author `private_dot_agent-of-empires/themes/catppuccin-mocha.toml` (scaffold via `aoe theme export tokyo-night-storm`, swap in Mocha hexes: base `#1e1e2e`, blue `#89b4fa`, green `#a6e3a1`, yellow `#f9e2af`, red `#f38ba8`, surface0 `#313244`) and set `[theme].name = "catppuccin-mocha"`. Pure aesthetics; `tokyo-night-storm` stays as the accepted fallback (within parent D8's "closest variant" allowance). TRIAL — verdict is a visual preference call.

### D7: Trial / verdict workflow

Mirror the parent change's soak model. SHIP items (D1, D2) commit immediately. TRIAL items (D3, D4, D6, `[sound]`, `[tools.lazygit]`) are built, used for ≥1 week, then kept or pruned (config + spec deltas reverted) before archive. The spec deltas describe the intended end state; pruned items have their requirements removed before `/opsx:archive`. This keeps the change additive and reversible.

## Risks / Trade-offs

- **[Risk] AoE re-serializes `settings.json` (sorts keys, reformats) after the baked hooks, reintroducing diff noise.** → Mitigation: align the template's key order to AoE's serialized output, or accept the one-time reformat and let it settle. Verify behavior after first `aoe` launch.
- **[Risk] `modify_` merge bug corrupts the live config or drops a managed key.** → Mitigation: tomlkit style-preserving round-trip + check-then-set (skip-if-equal); `MANAGED` verified as a superset of the prior static file (no key loss); idempotent; preserves 0600; fallback to passthrough/baseline when `uv` is absent. Acceptance gated on tests A (1:1 round-trip), B (idempotent re-apply), C (runtime tables preserved).
- **[Risk] Nested shell quoting in the gh-dash commands is fragile.** → Mitigation: pass the review prompt via worktrunk's `--` execute-args (auto POSIX-escaped); keep titles/groups short and quote-free; verify rendered command in trial.
- **[Risk] Review-team teammates can't invoke `/code-review:code-review` / `/code-review` / `/verify` in their context.** → Mitigation: verify skill availability for teammates; fallback to a single agent running the three sequentially.
- **[Risk] `aoe add` without `-l` still fires `on_create` hooks or the trust prompt blocks the non-interactive `-x`.** → Mitigation: verify with a repo that has hooks; `--trust-hooks` only on the trusted `a` binding if needed, never on `r`.
- **[Risk] `agent-manager` not synced → `openspec validate --strict` fails on the delta.** → Mitigation: D5 sequencing.
- **[Trade-off] `clipboard = "enabled"` enables `allow-passthrough`** — inner agent can write arbitrary escape sequences to the outer terminal. Accepted (agent already executes code locally); purely local, no network. Set `clipboard = "disabled"` only in untrusted contexts.

## Migration Plan

1. Implement SHIP items (D1 config knobs, D2 settings.json hooks) — additive, no rollback risk beyond reverting the commit.
2. Implement TRIAL items behind the verdict workflow (D7).
3. Validate: `claude-hooks` + `gh-dash-keybindings` deltas pass `openspec validate --strict` immediately; `agent-manager` delta after the parent archive/sync (D5).
4. Soak ≥1 week of real use. Prune rejected TRIAL items (config + spec deltas).
5. Run `/docs:manual` / `/docs:readme` if user-facing surface changed; archive via `/opsx:archive`.

**Rollback**: every change is additive and self-gating; revert the commit. No destructive operations.

## Open Questions

- Exact `aoe add` attach semantics: does `aoe add .` (no `-l`) register the worktrunk-created worktree as a session without creating a second worktree, and does it return cleanly under `wt -x`? (verify with `aoe add --help` flows + a real run)
- Does AoE rewrite/reorder the whole `settings.json` after the baked hooks, and if so what key order minimizes diff? (D2 mitigation)
- `Alt+g` collision audit for `[tools.lazygit]` against ghostty + tmux + AoE built-in bindings.
- Exact gh-dash PR template variable names beyond the proven `{{.PrNumber}}`/`{{.RepoName}}`/`{{.RepoPath}}` — confirm `{{.Title}}` (and any repo-only var for `reviews/<repo>` vs `reviews/<owner>/<repo>` group depth).
- ~~Which TOML-merge tool is already on PATH for the `modify_` script~~ → RESOLVED (D3): `tomlkit` via `uv run --with tomlkit` (uv already in `BREW_PACKAGES`); chosen over `dasel`/`yq` because only a style-preserving round-trip keeps `chezmoi diff` quiet across AoE rewrites.
