## Context

Ghostty's `shell-integration` setting controls which shell receives integration scripts (OSC 133 marks, cursor positioning, sudo forwarding, title updates). Currently hardcoded to `zsh`. The machine already runs `detect` — the repo config is the outlier.

## Goals / Non-Goals

**Goals:**

- Shell integration works automatically for any supported shell (zsh, bash, fish, elvish) launched inside Ghostty

**Non-Goals:**

- Changing `shell-integration-features` (cursor, sudo, title remain as-is)
- Adding support for unsupported shells — that's Ghostty upstream's concern

## Decisions

### Use `detect` over enumerating shells

**Choice**: `shell-integration = detect` rather than listing specific shells.

**Why**: `detect` delegates shell identification to Ghostty's runtime detection, which already handles all supported shells. Enumerating shells (e.g., `zsh`, `bash`) would require config maintenance when adding new shells. `detect` is the Ghostty-recommended default.

**Alternatives considered**:

- Keep `zsh` — rejected because it silently drops integration for non-zsh sessions
- `none` + manual sourcing — rejected as unnecessary complexity with no benefit

## Risks / Trade-offs

- **Risk**: `detect` injects integration into shells where it wasn't previously active → **Mitigation**: Ghostty's integration scripts are well-tested and non-destructive; they're injected via `--login` startup files and silently no-op if the shell isn't supported
- **Risk**: Spec references become stale → **Mitigation**: Updating the spec in the same change
