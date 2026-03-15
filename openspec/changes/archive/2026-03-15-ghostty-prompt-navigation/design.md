## Context

Ghostty's shell integration (`shell-integration = zsh`) injects code that emits OSC 133 escape sequences at each prompt. The terminal records these positions. The `jump_to_prompt` action uses these markers to scroll directly to a prompt boundary.

The config already has `super+shift+left/right` for tab navigation. Adding `super+shift+up/down` for prompt navigation completes the directional keybinding pattern.

## Goals / Non-Goals

**Goals:**

- Enable instant navigation between prompts via keyboard shortcuts
- Follow the existing `super+shift+direction` keybinding convention

**Non-Goals:**

- Changing shell integration features or configuration
- Adding prompt-related visual indicators or decorations
- Customizable jump distances (e.g., jump 3 prompts at once)

## Decisions

### Keybinding choice: `super+shift+up/down`

Use `super+shift+up` for previous prompt and `super+shift+down` for next prompt.

**Rationale**: Extends the existing directional pattern (`super+shift+left/right` for tabs). Vertical axis maps naturally to scrollback navigation. These keys are currently unbound.

**Alternative considered**: `super+up/down` (without shift) — rejected because these are commonly used by macOS for window management and could conflict with system shortcuts.

### Placement: after tab navigation keybindings

Place the two new lines immediately after the existing `super+shift+left/right` tab navigation keybindings and before the `goto_tab` keybindings.

**Rationale**: Groups all `super+shift+direction` keybindings together for readability.

## Risks / Trade-offs

- [Minimal risk] If shell integration is disabled or breaks, `jump_to_prompt` silently does nothing — no error, no crash, just no navigation. → No mitigation needed.
