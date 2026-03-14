## Context

The repo config has `window-padding-x = 10, window-padding-y = 10` but the actual machine diverged to `8x4`. After hands-on A/B testing of four configurations (10x10, 10x6, 10x4,8, 8x4), `10x6` was chosen as the unified value across both machines.

`window-padding-balance = true` remains active, meaning configured values are minimums — actual padding = configured + leftover fractional-cell pixels distributed evenly.

## Goals / Non-Goals

**Goals:**

- Unify window padding values across repo and machine configs
- Document the rationale for the chosen values in the spec

**Non-Goals:**

- Changing `window-padding-balance` or `window-padding-color` behavior
- Per-context padding (Ghostty doesn't support different config for quick terminal vs main window)
- Changing horizontal padding (`window-padding-x` stays at 10)

## Decisions

### Keep horizontal padding at 10

Rationale: Horizontal padding doesn't reduce visible lines — it only affects line width. 10pt gives comfortable lateral breathing room. No reason to reduce it.

### Reduce vertical padding from 10 to 6

Rationale: `y=10` loses ~2-3 visible lines, which matters in the 40%-height quick terminal and during dense Claude Code sessions. `y=6` with `balance=true` yields effective padding of ~7-8pt — perceptually close to 10 but recovering those lines. `y=4` felt too utilitarian; `y=6` preserves a polished feel.

### Symmetric vertical padding (not asymmetric top/bottom)

Rationale: Asymmetric padding (e.g., `4,8`) is technically possible but felt visually off during testing. Uniform padding is simpler and more predictable.

## Risks / Trade-offs

- [Subjective preference] → Values were chosen through live A/B testing; can be revisited if preferences change.
- [Quick terminal density] → At 40% screen height, y=6 is still a compromise. If more lines are needed, y=4 is the fallback.
