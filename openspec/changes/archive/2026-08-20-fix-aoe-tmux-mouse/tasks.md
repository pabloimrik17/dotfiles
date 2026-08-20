## 1. Baseline

- [x] 1.1 Record the pre-change state so the fix is provably the cause: `tmux show-options -g mouse` (expect `on`) and `tmux show-options -t <an aoe session> mouse` (expect `off`).
- [ ] 1.2 Reproduce both DOT-40 symptoms in a live aoe session and note which is which: clicking a pane does not focus it; the wheel moves the agent's chat instead of the pane scrollback. — **closed, not verifiable**: the pre-change state no longer exists — the fix landed 2026-08-02 (`a98f5a1`) and the live config was written 2026-08-12; today is 2026-08-20. A synthetic repro (forcing `mouse off` on a throwaway session) was rejected by the user: it would prove the mechanism, not the original symptom.

## 2. Implementation

- [x] 2.1 In `dot_config/private_agent-of-empires/modify_private_config.toml`, change the `MANAGED` entry `(("tmux", "mouse"), "disabled", False)` to `"auto"`.
- [x] 2.2 Replace the stale rationale near that entry with the real semantics, in the repo's terse comment style: `"auto"` defers to `~/.tmux.conf` in each session; `"disabled"` applies `mouse off`, shadowing it; the entry is kept as a pinned no-op so `chezmoi apply` reverts a stray value. `"enabled"` is deliberately not documented there — the config will never hold it, and design D1 records why it was rejected.
- [x] 2.3 In `dot_tmux.conf`, extend the comment above `set -g mouse on` to state that aoe sessions inherit this setting rather than applying their own — the `tmux-config` delta requires the comment to record that relationship. Keep the existing one-line comment style.
- [x] 2.4 Confirm `set -g mouse on` is present and unmodified (`tmux-config` delta requires it; it is load-bearing under `auto`).
- [x] 2.5 Run `chezmoi diff` and confirm the only change to `~/.config/agent-of-empires/config.toml` is the single `mouse` line — AoE's runtime writeback tables must round-trip untouched (the `modify_` script's whole purpose).
- [x] 2.6 `chezmoi apply`.
- [x] 2.7 Correct the wording written in 2.3: `dot_tmux.conf:2` and the `MANAGED` comment at `modify_private_config.toml:75` both said AoE "mirrors" `~/.tmux.conf`; both now say it defers to it — matching measured 1.14.0 behavior and the `tmux-config` scenario "Comment records the AoE relationship".
- [x] 2.8 In `docs/manual.html`, fix the AoE config row: `tmux mouse` documented `disabled` — "deterministic; user owns it", verbatim the misreading this change corrects. Now `auto` — defers to `~/.tmux.conf` (`mouse on`); no second source of truth (`manual-web` requires sections to reflect current tool capabilities).

## 3. Verify the fix

Start from a **newly created** aoe session — AoE applied the option at session creation, so pre-existing sessions keep `mouse off` (design, Risks).

- [x] 3.1 `tmux show-options -t <new aoe session> mouse` resolves to `on`, and any session-local value matches `tmux show-options -g mouse` rather than shadowing it. — DONE. First measured on aoe 1.12.0 via a throwaway `aoe add --scratch --cmd claude --cmd-override sleep` session (no agent started, purged after): `local=[mouse on]`, `resolved=on`, vs non-aoe session `3` `local=[]`. Re-measured read-only on the installed aoe 1.14.0 across all four live `aoe_*` sessions: no session-local `mouse` at all (`show-options -A` → `mouse* on`, inherited), global `mouse on`. 1.14.0 abstains rather than mirrors; the assertion holds either way, and more strongly under abstention — artifacts state the outcome (`~/.tmux.conf` decides), not the mechanism.
- [x] 3.2 Clicking a pane selects/focuses it. — manual PASS (user, 2026-08-20): clicking an inactive pane moved focus to it.
- [x] 3.3 The wheel over an agent pane enters copy-mode and scrolls that pane's scrollback; the agent's chat does not move. — structural evidence recorded: `WheelUpPane` in the root table is tmux's unmodified default (`if-shell -F "#{||:#{alternate_on},#{pane_in_mode},#{mouse_any_flag}}" { send-keys -M } { copy-mode -e }`); `dot_tmux.conf` defines no wheel binding and sources no file. All 12 live aoe agent panes evaluate the condition to `0`, so they take the `copy-mode -e` branch. Awaiting a manual wheel-spin to confirm observed behavior. Manual PASS (user, 2026-08-20): the wheel entered copy-mode and scrolled the pane's own scrollback; the agent's chat did not move.
- [x] 3.4 `q` exits copy-mode and keystrokes reach the agent again (the mode is new inside aoe panes and reads as a stuck pane the first time). — **scripted verification withdrawn**: a mis-targeted `send-keys` landed in a live Claude Code pane, so all scripted tmux mutation was dropped for safety. Covered by the user's manual pass instead. Manual PASS (user, 2026-08-20): `q` left copy-mode and keystrokes reached the agent again.
- [x] 3.5 The wheel over a pane running a mouse-reporting TUI (gh-dash) still drives that TUI, not copy-mode. — no live sample available: no mouse-reporting TUI was running at measurement time (all 12 aoe panes evaluate the condition to `0`), so the `send-keys -M` branch has nothing to observe. The branch exists in tmux's unmodified default binding; needs gh-dash running to confirm. Manual PASS (user, 2026-08-20) with `gh dash` running: the wheel drove the TUI, no copy-mode.

## 4. Verify nothing else broke

- [x] 4.1 Drag-select inside a pane lands in the **system** clipboard (tmux buffer → OSC 52, via the untouched `tmux.clipboard = "enabled"`). — **scripted verification withdrawn** (same reason as 3.4); covered by the user's manual pass. Manual PASS (user, 2026-08-20): the selection pasted outside tmux with Cmd+V, so the OSC 52 leg works end to end.
- [x] 4.2 Shift+drag still yields Ghostty's native selection spanning the window (the D3 escape hatch — confirm it works before archiving, do not assume). — manual PASS (user, 2026-08-20): Shift+drag gave Ghostty's native selection spanning both panes.
- [x] 4.3 mdfried renders Kitty graphics inside a pane — the canary for `allow-passthrough` (design, Risks). — manual PASS (user, 2026-08-20): the image rendered, so `allow-passthrough` is intact.
- [x] 4.4 A non-aoe tmux session still behaves as before. — measured on a throwaway non-aoe session (`tmux new-session -d`, removed after): zero session-local options, `show-options -A` → `mouse* on` (inherited), condition evaluates `0`. Matches pre-change behavior; this change never touched the global option.

## 5. Close out

- [x] 5.1 `openspec validate fix-aoe-tmux-mouse --strict`.
- [x] 5.2 Update DOT-40 with the root cause (the `"disabled"` misreading in `improve-aoe-config` D1), why `"enabled"` was rejected in favour of `"auto"` (D1), and the D3 drag-select trade-off — so the ticket records why the wheel-binding approach it proposed was not needed. — DONE as a comment (the issue was already Done since 2026-08-02, so the record is appended rather than rewritten). Also records the 1.12.0→1.14.0 mechanism change.
- [x] 5.3 Note the D4 leftover — `default-terminal = "xterm-256color"` vs `tmux-256color` — as a separate ticket if still wanted; it is unrelated to the mouse. — DONE: DOT-63 (Backlog, Low), carrying the evidence for why it was ruled out as a DOT-40 cause.
