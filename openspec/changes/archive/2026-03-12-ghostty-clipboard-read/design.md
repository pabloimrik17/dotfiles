## Context

Ghostty config at `dot_config/ghostty/config` has a Copy/paste section with `copy-on-select`, `clipboard-paste-protection`, and `clipboard-trim-trailing-spaces`. No `clipboard-read` is set, so Ghostty uses default `deny`.

The existing `ghostty-ux-enhancements` spec covers clipboard handling but doesn't address `clipboard-read`.

## Goals / Non-Goals

**Goals:**

- Enable OSC 52 clipboard reads with user confirmation via `clipboard-read = ask`
- Document the security rationale inline

**Non-Goals:**

- Changing `clipboard-write` behavior (stays at default `allow`)
- Modifying any other Ghostty settings

## Decisions

### `ask` over `allow`

`allow` enables silent clipboard reads — any terminal program could exfiltrate passwords/tokens without user awareness. `ask` shows a confirmation dialog for each OSC 52 read request (user must approve each read attempt individually). The dialog is rare in practice (only tmux clipboard sync, neovim over SSH, or explicit scripts trigger it).

### Inline comment style

Add a comment above the setting explaining the security tradeoff. Follows the existing config style where section headers use `#` comments but individual settings don't have comments — this is an exception because the `ask` value is non-obvious and security-motivated.

## Risks / Trade-offs

- [Dialog fatigue] → Unlikely. OSC 52 reads are rare; most users see the dialog only with tmux or SSH neovim. → No mitigation needed.
- [Breaking silent workflows] → If a script relies on silent clipboard reads, it will now prompt. → Acceptable tradeoff per issue #39 discussion.
