## Context

Ghostty's `scrollback-limit` controls the scrollback buffer size **in bytes** (not lines). Default is 10,000,000 (~10MB). Memory is allocated lazily — setting a large value has no cost until the buffer fills. The setting is per terminal surface (tab/split), not global.

Current config (`dot_config/ghostty/config`) has no `scrollback-limit` entry, relying on the default.

## Goals / Non-Goals

**Goals:**

- Provide enough scrollback for extended AI coding sessions (~250K+ lines)
- Correct the misconception from issue #35 (bytes, not lines)
- Document the unit inline so future editors don't repeat the mistake

**Non-Goals:**

- Unlimited scrollback (not yet supported by Ghostty)
- Per-tab or conditional scrollback sizes
- Scrollback-to-disk or persistence across sessions

## Decisions

**50MB chosen over other values.** 50MB ≈ 250K-625K lines depending on line length. Covers worst-case AI sessions. 5 full tabs = 250MB, acceptable on any modern dev machine. Going higher (100MB+) offers diminishing returns with real RAM cost.

**Placed in Operational section.** Scrollback is an operational tuning concern, not visual or UX. Fits alongside `auto-update` and `macos-auto-secure-input`.

**Inline comment added.** The bytes-vs-lines confusion is a real footgun — a brief comment prevents it recurring.

## Risks / Trade-offs

- **RAM usage**: Only materializes when buffer fills. 50MB per tab is the ceiling, not the floor.
- **No risk to existing config**: Additive change, no existing settings modified.
