## 1. Pre-implementation verification (resolve design Open Questions)

- [x] 1.1 Run `aoe add --help` flows + a real run: confirm `aoe add .` (no `-l`) registers a worktrunk-created worktree as a session WITHOUT creating a second worktree, and that under `wt … -x 'aoe add .'` control returns to gh-dash (exec model). — `--help` confirms: no `-w` ⇒ no worktree created (registers cwd), no `-l` ⇒ returns immediately. Live exec-model run folded into 8.4 (soak).
- [ ] 1.2 Confirm whether AoE re-serializes/reorders the whole `~/.claude/settings.json` after the baked hooks land; capture the key order it writes so the template can match it (minimize `chezmoi diff`). — INTERACTIVE: requires launching `aoe` once and diffing the live (chezmoi-managed) settings.json; deferred to soak.
- [x] 1.3 Audit `Alt+g` against ghostty, tmux, and AoE built-in bindings — confirm no collision before shipping `[tools.lazygit]`. — ghostty binds only `super+*` (free); tmux default prefix, no `M-g`/Alt root binding (free); lazygit present at /usr/local/bin/lazygit. AoE built-in overlay is the only residual check (folded into 7.2).
- [x] 1.4 Confirm the gh-dash PR template variables used render correctly (`{{.PrNumber}}`, `{{.RepoName}}`, `{{.RepoPath}}` proven; verify `{{.Title}}`) and decide group depth (`reviews/{{.RepoName}}` → `reviews/owner/repo`). — `{{.RepoName}}` already renders as `owner/repo` in existing `b`/`t` bindings, so `reviews/{{.RepoName}}` = `reviews/owner/repo` (depth accepted). `{{.Title}}` was DROPPED from `f` (shell-injection risk, CodeRabbit PR #152) → only `{{.PrNumber}}`/`{{.RepoName}}`/`{{.RepoPath}}` remain, all proven.
- [x] 1.5 Identify a TOML-merge tool already on PATH (python `tomllib`+`tomli_w`, `dasel`, or `yq`) for the `modify_` script; if none, the writeback trial falls back to the static-file + accept-thrash stance. — RESOLVED: none present (`dasel`/`yq`/`tomljson` missing; system python 3.9.6 has no `tomllib`/`tomli_w`). Per policy (no new brew dep just for this) ⇒ **fall back to static file + accept thrash** (governs Group 4).

## 2. SHIP — AoE config knobs

- [x] 2.1 Add `[tmux].clipboard = "enabled"` to `private_dot_agent-of-empires/private_config.toml` (OSC 52 passthrough for wrapped agents).
- [x] 2.2 Add `[tmux].mouse = "disabled"` (determinism; user owns `~/.tmux.conf`).
- [x] 2.3 Add `[status_hooks].on_error` invoking `terminal-notifier` with a distinct sound (e.g. `-sound Basso`), mirroring `on_waiting`/`on_idle`.
- [ ] 2.4 `chezmoi apply` (or dry-run) and confirm the three keys render and the file stays `0600`. — Static-validated (TOML parses; all three keys present; `private_` prefix guarantees 0600). Live `chezmoi apply` deferred to post-merge (dev clone source not yet synced to `~/.local/share/chezmoi`).

## 3. SHIP — Bake AoE status hooks into the Claude settings template

- [x] 3.1 Add the five AoE session-status hooks to the `hooks` block of `dot_claude/settings.json.tmpl`: `UserPromptSubmit`/`PreToolUse`/`ElicitationResult` → `running`, `Notification` (matcher `permission_prompt|elicitation_dialog`) → `waiting`, `Stop` → `idle`; each `sh -c '[ -n "$AOE_INSTANCE_ID" ] || exit 0; mkdir -p /tmp/aoe-hooks/$AOE_INSTANCE_ID 2>/dev/null; printf <status> > /tmp/aoe-hooks/$AOE_INSTANCE_ID/status 2>/dev/null; exit 0'`. — Template renders to valid JSON; self-gate functionally tested (unset ⇒ no-op exit 0; set ⇒ writes status).
- [x] 3.2 Keep the existing `SessionStart`/`PreCompact` `bd prime` hooks intact.
- [ ] 3.3 Apply the key order learned in 1.2 so `chezmoi diff` is clean after the next `aoe` launch. — Blocked on 1.2 (AoE's serialization order is unknown until observed live). Hooks baked in a clean explicit order for now.
- [ ] 3.4 `chezmoi apply`, launch `aoe`, confirm the status column works and `~/.claude/settings.json` no longer thrashes against the template. — INTERACTIVE / soak.

## 4. TRIAL — config.toml writeback preservation (modify_)  — DEFERRED (D3 fallback; see 1.5: no TOML-merge tool on PATH)

- [ ] 4.1 Convert `private_dot_agent-of-empires/private_config.toml` to `modify_private_dot_agent-of-empires/private_config.toml` using the tool from 1.5: merge only the managed keys (`[theme]`/`[session]`/`[worktree]`/`[tmux]`/`[updates]`/`[status_hooks]`/`[sandbox]`) into the on-disk TOML, preserving `[app_state]`/`[web]`/`[cockpit]`/`[logging]` and default-expanded keys. — NOT BUILT: falls back to static file (1.5). Config header documents the verdict.
- [ ] 4.2 Ensure idempotency and `0600` preservation; fold the SHIP keys from group 2 into the merged set. — N/A under fallback.
- [ ] 4.3 Verify: with AoE writeback present, `chezmoi apply` keeps runtime tables AND enforces managed values; `chezmoi diff` is quiet. — N/A under fallback (thrash accepted, documented).

## 5. TRIAL — Catppuccin Mocha theme

- [x] 5.1 Scaffold via `aoe theme export tokyo-night-storm`, swap in Mocha hexes (base `#1e1e2e`, blue `#89b4fa`, green `#a6e3a1`, yellow `#f9e2af`, red `#f38ba8`, surface0 `#313244`); save as `private_dot_agent-of-empires/themes/catppuccin-mocha.toml`. — Authored from exported schema; full Mocha palette mapped; parses OK.
- [x] 5.2 Set `[theme].name = "catppuccin-mocha"`; `aoe` renders it correctly. — Name set in config; live visual render is a soak check.

## 6. TRIAL — Sound

- [x] 6.1 `aoe sounds install`; set `[sound].enabled = true`. — Installed (10 sounds in `~/.agent-of-empires/sounds`); `[sound].enabled = true` set in config.
- [x] 6.2 Add the AoE sounds dir to `.chezmoiignore` (assets are not committable). — Created `.chezmoiignore` with `.agent-of-empires/sounds` (+ `/**`).

## 7. TRIAL — lazygit tool-session

- [x] 7.1 (Gated on 1.3) Add `[tools.lazygit]` with `command = "lazygit"` and `hotkey = "Alt+g"`. — Added (subtable kept last in private_config.toml).
- [ ] 7.2 Confirm `Alt+g` launches lazygit scoped to the session worktree, no chord collision. — INTERACTIVE (also covers the residual AoE-built-in-overlay check from 1.3).

## 8. TRIAL — gh-dash AoE queue keybindings (f / F)

- [x] 8.1 Add `f` (Queue in AoE) to the `prs:` keybindings: `wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x 'aoe add . -t "pr {{.RepoName}}#{{.PrNumber}}"'` (no `-l`, no `--trust-hooks`). — Added (plain scalar; YAML valid). Title uses a deterministic `pr repo#N` token instead of `{{.Title}}` (CodeRabbit PR #152): gh-dash renders the template before the shell, so a title with a `'` could break out of the `-x` payload and inject commands.
- [x] 8.2 Add `F` (Queue PR review team): `wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x 'aoe add . -t "review {{.RepoName}}#{{.PrNumber}}" -g "reviews/{{.RepoName}}" --extra-args' -- "Spin up a team of three agents to review this PR in parallel. None of them may post anything on the PR; every agent reports its findings back to me here. Agent 1: run /code-review:code-review. Agent 2: run /code-review. Agent 3: run /verify to confirm the changes actually work. When all three finish, consolidate everything into one summary here."` — Added as a folded block scalar (`>-`) so the `: ` and nested quotes stay literal; verified the folded result is the exact intended single line.
- [ ] 8.3 Confirm both keys are free (no built-in collision), have `name` fields, and gh-dash help shows them. — `name` fields present; YAML lists `b,i,t,B,I,T,f,F`. Built-in-collision + help-overlay check is INTERACTIVE.
- [ ] 8.4 Smoke test: `f` queues a session and returns to gh-dash; `F` queues a session whose lead spins up the 3-agent team and none post to the PR (verify teammates can invoke the three skills; fallback to sequential single-agent if not). — INTERACTIVE / soak.

## 9. Sequencing & validation

- [ ] 9.1 Resolve the `agent-manager` gate (design D5): archive `agent-management-strategy` (or `/opsx:sync agent-manager`) so the base capability exists in `openspec/specs/` before validating the `agent-manager` delta. — BLOCKED: `agent-management-strategy` is 22/31 (mid-soak); `agent-manager` not yet in `openspec/specs/`. Pre-archive action.
- [x] 9.2 `openspec validate improve-aoe-config --strict` passes (all three deltas). — PASSES ("Change 'improve-aoe-config' is valid").
- [ ] 9.3 `chezmoi diff` shows only the expected changes; re-run installer idempotently (no new installs). — Requires the branch synced to `~/.local/share/chezmoi`; deferred to post-merge.

## 10. Soak, verdict, docs, archive

- [ ] 10.1 Use the new config + bindings for ≥1 week of real use across multiple repos.
- [ ] 10.2 Verdict on each TRIAL item (modify_, theme, sound, lazygit, f/F bindings): keep or prune. Pruned items have their config changes AND spec requirements reverted.
- [ ] 10.3 Run `/docs:manual` (and `/docs:readme` if tool-level surface changed) for the kept items.
- [ ] 10.4 `/opsx:archive improve-aoe-config` once SHIP items are verified and TRIAL verdicts are applied.
