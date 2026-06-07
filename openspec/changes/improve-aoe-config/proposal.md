## Why

The Agent of Empires config shipped by `agent-management-strategy` is deliberately minimal (34 lines, most features deferred). Real use surfaced two defects and several deferred features now worth enabling: (a) `[tmux].clipboard` defaults to `auto`, which is a no-op when a hand-owned `~/.tmux.conf` exists — so OSC 52 select-to-copy from wrapped Claude/OpenCode sessions is silently swallowed; (b) AoE injects its session-status hooks into `~/.claude/settings.json`, a chezmoi-managed file, so every `chezmoi apply` clobbers them and a fresh machine starts with the AoE status column broken. The goal is to level the config up — keyboard-first, worktrunk-aware, versioned, private (0600), low-thrash — without enabling anything that exposes a network port or fights the bun-only toolchain.

## What Changes

**SHIP (committed):**

- `[tmux].clipboard = "enabled"` — force `set-clipboard on` + `allow-passthrough on` for AoE sessions so OSC 52 writes from wrapped agents reach the terminal. Aligned with the existing `clipboard-read = ask` security posture (read still prompts; only write/passthrough is enabled).
- `[tmux].mouse = "disabled"` — determinism: the user owns `~/.tmux.conf` (`mouse on`); pin it instead of `auto` presence-detection.
- `[status_hooks].on_error` — notify on crashed/errored sessions via `terminal-notifier` with a distinct sound (today only `waiting`/`idle` notify).
- Bake AoE's five session-status hooks into `dot_claude/settings.json.tmpl` (`UserPromptSubmit`/`PreToolUse`/`ElicitationResult` → running, `Notification` → waiting, `Stop` → idle). They self-gate on `$AOE_INSTANCE_ID` (no-op outside AoE sessions) and are static, so the AoE status column survives `chezmoi apply` and reproduces on new machines with zero impact on normal Claude sessions.

**TRIAL → verdict before archive** (build, use ≥1 week, keep or prune at archive — mirrors `agent-management-strategy` D6/soak):

- A chezmoi management strategy for `~/.agent-of-empires/config.toml` (a `modify_` script using `tomlkit` via `uv`) that merges only the deliberately-managed keys and preserves AoE's runtime writeback (`[app_state]`/`[web]`/`[cockpit]`/`[logging]` and default-expanded tables), eliminating the recurring `chezmoi diff` thrash (live file is ~110 lines vs the 34-line source) and preventing `apply` from clobbering live state. tomlkit's style-preserving round-trip keeps the diff quiet across AoE rewrites (see design D3).
- `[theme]` custom `catppuccin-mocha` (AoE ships only `catppuccin-latte` (light); align with the Mocha stack) shipped as `private_dot_agent-of-empires/themes/catppuccin-mocha.toml`.
- `[sound]` state-transition audio (`aoe sounds install`) for parallel-session awareness.
- `[tools.lazygit]` tool-session bound to `Alt+g` (lazygit already installed; audit the chord against ghostty/tmux/AoE built-ins first).
- Two `gh-dash` keybindings, both worktrunk-first (`wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x 'aoe add . …'`, registering the worktree as an AoE session **without launching** so the fleet fills up for later):
  - `a` — queue the PR as an AoE session (`-t "pr {{.RepoName}}#{{.PrNumber}}"` — a deterministic token, not the free-text `{{.Title}}`, which is a shell-injection vector).
  - `r` — queue a PR **review team**: the session's initial prompt spins up three agents (Claude Code agent teams, already enabled via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) running `/code-review:code-review`, `/code-review`, and `/verify`, none posting to the PR, all reporting back in-session; grouped under `reviews/{{.RepoName}}`.

**REJECT (documented, with re-evaluation triggers):**

- **Cockpit (ACP mode)** — Beta/opt-in, requires Node ≥20 + per-agent ACP adapters (conflicts with the repo's bun-only policy), and is tied to the web surface. Trigger: revisit when Cockpit leaves Beta and a Node/npm dependency is acceptable.
- **`aoe serve` / web dashboard / remote phone access** — opens a listening port and (with `--remote`) a public HTTPS tunnel. No `config.toml` keys exist; if ever wanted it belongs in a manual `zsh` alias, never auto-started.
- **`[session].yolo_mode_default = true`** — removes the agent permission gate; keep `false`.
- **`[worktree].enabled = true` at global scope** — silently bypasses the worktrunk hook chain (per `agent-management-strategy` D5). Per-repo opt-in only.

## Capabilities

### New Capabilities

None. All work modifies existing capabilities.

### Modified Capabilities

- `agent-manager`: AoE `config.toml` gains tmux clipboard/mouse determinism and `status_hooks.on_error` (SHIP), plus an optional theme/sound/lazygit tool-session and a writeback-preserving chezmoi management strategy (TRIAL). **Sequencing dependency**: `agent-manager` is defined by the in-progress `agent-management-strategy` change and is not yet in `openspec/specs/`; this delta requires that change to be archived/synced first (see design.md).
- `claude-hooks`: the chezmoi-managed `settings.json.tmpl` hooks block gains AoE's self-gating session-status hooks so the status column is versioned and reproducible.
- `gh-dash-keybindings`: add the `a` (queue AoE session) and `r` (queue AoE review team) keybindings. Note: these are queue-without-open bindings, so they intentionally do not follow the existing lowercase/uppercase direct/tmux variant pattern (`aoe add` returns immediately rather than taking the terminal); the delta must reconcile that requirement.

## Impact

- **Code touched**: `private_dot_agent-of-empires/private_config.toml` (SHIP knobs; TRIAL may convert it to a `modify_` script), `dot_claude/settings.json.tmpl` (AoE status hooks), `dot_config/gh-dash/config.yml` (keybindings `a`/`r`), and a new `private_dot_agent-of-empires/themes/catppuccin-mocha.toml` if the theme trial ships.
- **Sequencing**: builds on `agent-management-strategy`; the `agent-manager` delta cannot validate until that change is archived (or the two are co-sequenced). The `claude-hooks` and `gh-dash-keybindings` deltas have no such dependency.
- **External deps**: none for SHIP. TRIAL `modify_` strategy uses `tomlkit` provisioned by `uv` (already in `BREW_PACKAGES` — no new dep; tomlkit is fetched/cached ephemerally by `uv run --with tomlkit`). TRIAL `[sound]` fetches CC0 assets via `aoe sounds install` into a non-committable `sounds/` dir (must be `.chezmoiignore`d).
- **Security**: `gh-dash` `r` reviews untrusted PRs → `--trust-hooks` is deliberately omitted (auto-trusting a repo's `.agent-of-empires/` hooks would run unreviewed code). `[tmux].clipboard = "enabled"` enables `allow-passthrough` (local terminal only; no network) and leaves ghostty's `clipboard-read = ask` untouched.
- **Platform**: macOS-gated like the parent change; `status_hooks` and the baked notifier hooks assume `terminal-notifier` (macOS). OpenCode receives no AoE status-hook injection today — Claude-only fleet status is in scope; OpenCode status is out of scope.
- **Trial/verdict workflow**: TRIAL items are validated in ≥1 week of real use; rejected ones are pruned (config + spec deltas reverted) before archive. No breaking changes — every SHIP item is additive and self-gating.
