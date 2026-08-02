## Why

`improve-aoe-config` pinned `[tmux].mouse = "disabled"` intending "AoE never touches tmux mouse mode, leaving the user-owned `~/.tmux.conf` (`mouse on`) authoritative" (the spec's own words). In AoE that value means the opposite: **apply `mouse off`** to every session it creates. AoE writes it as a session-local tmux option, which shadows the global `mouse on` from `dot_tmux.conf:2`, killing click-to-select-pane and handing the scroll wheel to the agent TUI instead of the pane's scrollback (DOT-40).

The value that means what the spec wanted is `"auto"` — AoE's own schema documents it as *"Auto respects your tmux config"*.

## What Changes

- Change `(("tmux", "mouse"), ...)` in `dot_config/private_agent-of-empires/modify_private_config.toml` from `"disabled"` to `"auto"`, so AoE mirrors the global `mouse on` into each session it creates instead of forcing `off`.
- Rewrite the `agent-manager` requirement that encodes the misreading, so the spec mandates the value that produces the behavior it already describes.
- Specify the setting the fix now depends on: `dot_tmux.conf` SHALL set `mouse on`. It is there today but unspecified, so nothing currently protects it — and under `auto` it becomes the single authority for mouse behavior in aoe panes.

Not a breaking change to any interface, but it **does change daily mouse behavior**: with the mouse active, tmux owns drag-select inside aoe panes (copy-mode, confined to one pane, reaching the system clipboard via the already-enabled OSC 52 passthrough) instead of Ghostty's native selection. Shift+drag remains the escape hatch. See design D3.

Explicitly **not** changing:

- Not `"enabled"`. It fixes the symptom but restores a second source of truth for the mouse, with AoE silently outranking `dot_tmux.conf` — structurally the same arrangement that produced this bug. See design D1.
- No custom `WheelUpPane`/`WheelDownPane` bindings. tmux 3.7b's default root table already implements the policy DOT-40 asks for (wheel → pane scrollback unless the app is in alternate-screen or requested mouse reporting). See design D2.
- No `default-terminal` change. It sets the TERM *inside* panes; mouse is negotiated against the outer terminal. Unrelated to the symptoms.
- No `session.click_action` / `*_attach_mode` change, and no `AOE_MOUSE_CAPTURE` change. Those govern the AoE dashboard TUI (clicking a session row, the dashboard's own wheel capture), not pane mouse handling. See design D4.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `agent-manager`: the "AoE tmux mouse mode is deterministic" requirement changes the mandated value from `"disabled"` to `"auto"` and restates the rationale, because the current requirement's stated goal and its mandated value contradict each other.
- `tmux-config`: adds a requirement that `dot_tmux.conf` sets `mouse on`. The file has carried this since inception but no requirement covers it; the `agent-manager` change above makes it load-bearing rather than incidental.

## Impact

- **Code touched**: `dot_config/private_agent-of-empires/modify_private_config.toml` (one entry in `MANAGED`), `dot_tmux.conf` (comment only — the `mouse on` line itself is already correct).
- **Runtime effect**: applies to aoe sessions created *after* the change. Sessions already running keep their session-local `mouse off` until recreated, or until `tmux set-option -t <session> mouse on` is run by hand.
- **Interaction with `tmux.clipboard = "enabled"`**: unchanged and load-bearing — it already sets `set-clipboard on` + `allow-passthrough on`, which is what carries tmux copy-mode selections to the system clipboard once tmux owns the drag. Note this key deliberately stays pinned rather than moving to `auto`: unlike the mouse, no setting in `dot_tmux.conf` provides it.
- **External deps**: none. No new brew packages, no aoe version bump.
- **Concurrent changes**: `update-brew-deps` also carries an `agent-manager` delta but does not touch the mouse requirement, so the two deltas do not overlap.
- **Platform**: macOS, same as the parent change. Requires tmux ≥ 3.x for the default wheel binding relied on (verified on 3.7b).
