# agent-manager Delta

## MODIFIED Requirements

### Requirement: AoE tmux mouse mode is deterministic

The AoE config SHALL set `[tmux].mouse = "auto"`, the value AoE documents as respecting the user's tmux config: AoE leaves the session-local `mouse` option unset, so the global set by `~/.tmux.conf` resolves through instead of being shadowed. `~/.tmux.conf` SHALL remain the single authority for mouse behavior inside aoe panes.

The value SHALL NOT be `"disabled"`: in AoE that means "apply `mouse off`", written as a session-local tmux option, which shadows the global setting rather than deferring to it.

The value SHALL NOT be `"enabled"` either. It produces the same observable behavior as `"auto"` on a host whose `~/.tmux.conf` sets `mouse on`, but it does so by having AoE assert the value independently, so the two configs can silently disagree — the arrangement that caused this requirement to be wrong in the first place. Under `"auto"` AoE asserts no value of its own, so there is nothing that can disagree with `~/.tmux.conf`.

The key SHALL remain present in the chezmoi-managed config rather than being omitted. Omission is behaviorally identical to `"auto"`, but an explicit entry pins the no-op: it records the decision and lets `chezmoi apply` revert any value written into the live config by hand or by AoE.

Because the mouse is active inside aoe panes, this requirement depends on the tmux clipboard passthrough requirement remaining satisfied: tmux copy-mode selections reach the system clipboard only via `set-clipboard on` + `allow-passthrough on`.

#### Scenario: Mouse mode pinned to auto

- **WHEN** the AoE config is rendered by chezmoi
- **THEN** it contains `mouse = "auto"` under a `[tmux]` table

#### Scenario: AoE defers the tmux mouse option rather than overriding it

- **WHEN** a new aoe session is created after the config is applied
- **THEN** the session resolves `mouse` to `on`
- **AND** any session-local `mouse` value equals the global one set by `~/.tmux.conf`, so it never shadows it with a different value

#### Scenario: Clicking a pane selects it

- **WHEN** the user clicks a pane in an aoe session
- **THEN** that pane becomes the active pane

#### Scenario: Wheel scrolls the pane, not the agent

- **WHEN** the user scrolls the wheel over an aoe pane running an agent that is neither in alternate-screen nor requesting mouse reporting
- **THEN** the pane enters copy-mode and scrolls its own scrollback
- **AND** the agent's TUI does not receive the scroll as input

#### Scenario: Applications that request the mouse still receive it

- **WHEN** the user scrolls the wheel over an aoe pane whose application is in alternate-screen or has enabled mouse reporting
- **THEN** the wheel events are forwarded to that application unchanged
