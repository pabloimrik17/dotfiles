## 1. Baseline

- [x] 1.1 Record the pre-change state so the fix is provably the cause: `tmux show-options -g mouse` (expect `on`) and `tmux show-options -t <an aoe session> mouse` (expect `off`).
- [ ] 1.2 Reproduce both DOT-40 symptoms in a live aoe session and note which is which: clicking a pane does not focus it; the wheel moves the agent's chat instead of the pane scrollback.

## 2. Implementation

- [x] 2.1 In `dot_config/private_agent-of-empires/modify_private_config.toml`, change the `MANAGED` entry `(("tmux", "mouse"), "disabled", False)` to `"auto"`.
- [x] 2.2 Replace the stale rationale near that entry with the real semantics: `"auto"` = AoE respects `~/.tmux.conf` (its documented meaning); `"disabled"` = AoE applies `mouse off`, not "don't manage"; `"enabled"` = AoE asserts `mouse on` independently. Note the entry is kept deliberately as a pinned no-op so `chezmoi apply` reverts any stray value.
- [x] 2.3 In `dot_tmux.conf`, extend the comment above `set -g mouse on` to state that aoe sessions inherit this setting rather than applying their own — the `tmux-config` delta requires the comment to record that relationship. Keep the existing one-line comment style.
- [x] 2.4 Confirm `set -g mouse on` is present and unmodified (`tmux-config` delta requires it; it is load-bearing under `auto`).
- [x] 2.5 Run `chezmoi diff` and confirm the only change to `~/.config/agent-of-empires/config.toml` is the single `mouse` line — AoE's runtime writeback tables must round-trip untouched (the `modify_` script's whole purpose).
- [x] 2.6 `chezmoi apply`.

## 3. Verify the fix

Start from a **newly created** aoe session — AoE applied the option at session creation, so pre-existing sessions keep `mouse off` (design, Risks).

- [x] 3.1 `tmux show-options -t <new aoe session> mouse` resolves to `on`, and any session-local value matches `tmux show-options -g mouse` rather than shadowing it. — DONE via a throwaway `aoe add --scratch --cmd claude --cmd-override sleep` session (no agent started, purged after): `local=[mouse on]`, `resolved=on`, vs non-aoe session `3` `local=[]`. Note `auto` mirrors `~/.tmux.conf` into the session; it does **not** abstain — artifacts corrected accordingly.
- [ ] 3.2 Clicking a pane selects/focuses it.
- [ ] 3.3 The wheel over an agent pane enters copy-mode and scrolls that pane's scrollback; the agent's chat does not move.
- [ ] 3.4 `q` exits copy-mode and keystrokes reach the agent again (the mode is new inside aoe panes and reads as a stuck pane the first time).
- [ ] 3.5 The wheel over a pane running a mouse-reporting TUI (gh-dash) still drives that TUI, not copy-mode.

## 4. Verify nothing else broke

- [ ] 4.1 Drag-select inside a pane lands in the **system** clipboard (tmux buffer → OSC 52, via the untouched `tmux.clipboard = "enabled"`).
- [ ] 4.2 Shift+drag still yields Ghostty's native selection spanning the window (the D3 escape hatch — confirm it works before archiving, do not assume).
- [ ] 4.3 mdfried renders Kitty graphics inside a pane — the canary for `allow-passthrough` (design, Risks).
- [ ] 4.4 A non-aoe tmux session still behaves as before.

## 5. Close out

- [x] 5.1 `openspec validate fix-aoe-tmux-mouse --strict`.
- [ ] 5.2 Update DOT-40 with the root cause (the `"disabled"` misreading in `improve-aoe-config` D1), why `"enabled"` was rejected in favour of `"auto"` (D1), and the D3 drag-select trade-off — so the ticket records why the wheel-binding approach it proposed was not needed.
- [ ] 5.3 Note the D4 leftover — `default-terminal = "xterm-256color"` vs `tmux-256color` — as a separate ticket if still wanted; it is unrelated to the mouse.
