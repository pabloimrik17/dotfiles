## Context

See proposal.md — Why. This section records only what was measured, because the fix is a one-value edit and all its weight rests on the diagnosis being right.

Measured on aoe 1.12.0 / tmux 3.7b / Ghostty, with three live aoe sessions:

```
tmux show-options -g mouse            → mouse on      (dot_tmux.conf:3)
tmux show-options -t <each session>   → mouse off     (×3, session-local)
```

A session-local option beats the global, so every aoe session runs with the mouse off. That is AoE acting on `[tmux].mouse = "disabled"` from `modify_private_config.toml`, not tmux misreading `~/.tmux.conf`.

AoE's settings schema documents the enum:

> `tmux.mouse` — "Control mouse scrolling (**Auto respects your tmux config**)."

The values were also probed against a throwaway `XDG_CONFIG_HOME`:

| value | `aoe settings explain tmux.mouse` |
| --- | --- |
| `"enabled"` | `source: user value` |
| `"disabled"` | `source: user value` |
| `"auto"` | `source: schema default` |
| `"bogus"` | `source: schema default` |

So `auto` is reported as if unset, and an invalid value degrades silently to `auto` rather than failing the config load.

Measured after applying the fix. On aoe 1.14.0 (installed), `auto` writes no session-local `mouse` at all — live aoe sessions carry none and inherit the global `mouse on`. On aoe 1.12.0, the version measured above, `auto` instead wrote a session-local `mouse on` mirroring `~/.tmux.conf`. The mechanism changed between versions; the resolved value and the DOT-40 fix are identical either way, so the requirement is worded against the outcome — `~/.tmux.conf` decides — not against mirroring.

Corroborating field evidence: a second machine of the user's runs `mouse = "auto"` and has none of the DOT-40 symptoms.

Pane state at the time of measurement:

```
aoe panes (Claude Code):  alternate_on=0  mouse_any=0
gh-dash pane:             alternate_on=1  mouse_any=1
```

## Goals / Non-Goals

**Goals:**

- Make the shipped value match the behavior the `agent-manager` spec already claims to want.
- Leave exactly one place that decides mouse behavior for aoe panes.
- Reach the DOT-40 policy (wheel drives pane scrollback by default, cedable to apps that ask) with no tmux bindings of our own.

**Non-Goals:**

- Changing `set -g mouse on` itself. It is already correct; this change only specifies it and stops AoE from shadowing it.
- Auditing `default-terminal`, `click_action`, `*_attach_mode`, or `AOE_MOUSE_CAPTURE`. See D4.
- Changing behavior of non-aoe tmux sessions. They already inherit the global `mouse on` and are untouched.

## Decisions

### D1: `"auto"`, not `"enabled"`

Both values fix DOT-40 on a host whose `~/.tmux.conf` sets `mouse on`. They differ in where the decision lives.

`improve-aoe-config` D1 chose `"disabled"` as the deterministic counterpart to `"auto"`, reasoning by analogy with `status_bar = "disabled"`. The analogy breaks: for `status_bar`, "disabled" means "don't draw AoE's bar" — a genuine opt-out, protecting the user's Catppuccin status line. For `mouse`, the same word means "apply `mouse off`" — an opt-*in* to the opposite behavior. AoE spells the actual opt-out `auto`, and documents it as "respects your tmux config".

The tempting repair is `"enabled"`: it is pinned, it survives the probe as a `user value`, and it yields `mouse on`. It was the first candidate here and was rejected. `"enabled"` writes a session-local option; `auto` writes none (measured above), so `dot_tmux.conf` resolves through unopposed and there is no second value to disagree with it. `"enabled"` re-establishes two independent sources of truth for the mouse, with AoE's session-local write outranking `dot_tmux.conf` silently. That is structurally the arrangement that produced this bug — a value in the AoE config quietly overriding the file the reader believes is authoritative. Fixing the symptom by rebuilding the mechanism is a worse outcome than fixing it by removing the mechanism, even though today the two are observationally identical.

The determinism the original design wanted was not wrong; it was applied at the wrong layer. Under `auto` it moves to where it belongs: `dot_tmux.conf` gets an explicit requirement (`tmux-config` delta) so the `mouse on` line is protected by spec rather than by habit. One authority, specified.

Rejected: deleting the key entirely. Behaviorally identical to `auto`, but it drops the record of a decision this repo has now got wrong once, and it gives up chezmoi's ability to revert a stray `disabled` written into the live config later. Keeping the key at `auto` is a *pinned no-op* — determinism about not interfering.

### D2: No custom wheel bindings

DOT-40 proposes binding `WheelUpPane`/`WheelDownPane` conditionally on alternate-screen. tmux 3.7b already ships exactly that as a default root binding:

```
WheelUpPane     if-shell -F "#{||:#{alternate_on},#{pane_in_mode},#{mouse_any_flag}}" { send-keys -M } { copy-mode -e }
MouseDown1Pane  select-pane -t = ; send-keys -M
```

Against the measured pane state: aoe agent panes (`alternate_on=0, mouse_any=0`) fall to `copy-mode -e` — the pane's own scrollback. The gh-dash pane (`alternate_on=1, mouse_any=1`) falls to `send-keys -M` — forwarded untouched. That is the requested policy verbatim, so writing our own binding would only be a slightly-worse copy that we then have to maintain against tmux's defaults.

Rejected: adding the bindings anyway "for explicitness". It would shadow a default that already tracks upstream, and the two would drift.

### D3: Accept tmux ownership of drag-select

This is the only user-visible regression, and it is inherent to the mouse being active — not avoidable by tuning, and identical under `auto` or `enabled`.

| | before (`mouse off`) | after (mouse on) |
| --- | --- | --- |
| drag handled by | Ghostty | tmux copy-mode |
| selection spans | whole window | one pane |
| lands in | system clipboard via `copy-on-select` | tmux buffer → system clipboard via OSC 52 |

The OSC 52 leg already works: `[tmux].clipboard = "enabled"` sets `set-clipboard on` + `allow-passthrough on`, shipped by `improve-aoe-config` D1 and unchanged here. Ghostty's native selection stays reachable with Shift+drag, the standard bypass.

Accepted because the two symptoms in DOT-40 are hit constantly and drag-select has a one-key workaround, while the reverse is not true. The user's second machine has run with the mouse active for some time without this being reported as a problem, which is the best evidence available that the trade is tolerable. If it turns out not to be, the fallback is reverting, not patching around it — no configuration gives tmux the wheel and Ghostty the drag.

Note `[tmux].clipboard` deliberately stays `"enabled"` rather than following the mouse to `auto`: `auto` would defer to `~/.tmux.conf`, and `dot_tmux.conf` sets neither `set-clipboard` nor (for this purpose) an equivalent — `allow-passthrough on` is there for Kitty graphics, not OSC 52. There is nothing to defer to, so pinning is correct there and deferring is correct here. The two keys differ because the underlying facts differ, not by inconsistency.

### D4: Leave `default-terminal`, `click_action`, `*_attach_mode`, `AOE_MOUSE_CAPTURE` alone

DOT-40 lists the first three as suspects. None can produce the symptoms:

- `default-terminal` sets the TERM advertised to applications *inside* panes. Mouse tracking between tmux and Ghostty is negotiated on the outer side, from the TERM tmux itself was launched under. It cannot gate whether tmux binds the wheel. (`tmux-256color` may still be the more correct value than `xterm-256color`, but that is a different defect with a different failure mode — separate change if wanted.)
- `click_action` and the `*_attach_mode` keys govern the AoE dashboard TUI — what happens when you click a *session row* in the list. They never reach tmux's pane mouse handling. They also sit at schema default and are not in `MANAGED`, so touching them would widen what this repo owns for no diagnosed reason.
- `AOE_MOUSE_CAPTURE` / the dashboard's mouse-capture setting turned up while reading the schema and is worth naming so it is not re-investigated later: it makes the AoE *dashboard* request xterm mouse tracking for its own preview-pane scroll and row selection. Also not pane handling.

## Risks / Trade-offs

- **Drag-select changes under the user's hands (D3)** → Shift+drag restores Ghostty selection; documented in tasks.md verification so it is confirmed working before archive, not assumed.
- **The fix now depends on an unrelated line staying put** — under `auto`, deleting `set -g mouse on` from `dot_tmux.conf` silently reintroduces DOT-40, since tmux's own default for `mouse` is `off` → the `tmux-config` delta specifies the line and its comment records why it is load-bearing.
- **Running sessions keep `mouse off`** — AoE applied the option at session creation, so the fix looks like it did nothing until sessions are recreated → verification starts from a *new* session; existing ones can be fixed in place with `tmux set-option -t <session> mouse on`.
- **Silent degradation on typo** — an invalid value falls back to `auto` with no error. Under this change that happens to be the desired value, so a typo would *hide* itself rather than break anything → verification asserts the resolved tmux option on a live session, not the config text.
- **Copy-mode is a mode** — the wheel now leaves the pane in copy-mode, and keystrokes go to copy-mode until `q`. Normal tmux behavior, but new inside aoe panes and will read as a stuck pane the first time → called out in verification.
- **`allow-passthrough` regression** — tmux owning the mouse does not touch passthrough, but mdfried's Kitty graphics are the canary for anything that does → verified explicitly.

## Migration Plan

One-way and trivially reversible: restore the previous value and re-run `chezmoi apply`. No state migration; no data at risk. Sessions created between apply and revert carry whichever value was live at their creation.
