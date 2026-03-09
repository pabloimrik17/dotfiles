## Why

Claude Code and AI tools generate massive terminal output. Ghostty's default scrollback (10MB / ~50K-125K lines) can be exceeded during intensive sessions, losing earlier output. Issue #35 proposed `scrollback-limit = 100000` believing the unit was lines — but Ghostty measures scrollback in **bytes**, so that value (100KB) would actually **reduce** scrollback ~100x below default.

## What Changes

- Add `scrollback-limit = 50000000` (~50MB, ~250K-625K lines) to the Operational section of `dot_config/ghostty/config`
- Include inline comment clarifying the unit is bytes and allocation is lazy

## Capabilities

### New Capabilities

- `ghostty-scrollback`: Configures Ghostty's scrollback buffer size for AI-heavy terminal workflows

### Modified Capabilities

_(none — existing Ghostty specs cover visual, UX, and quick-terminal; scrollback is a new operational concern)_

## Impact

- **Files modified**: `dot_config/ghostty/config` (1 line + comment in Operational section)
- **Dependencies**: None
- **Risk**: Near zero — memory allocated lazily, no impact until buffer fills. 50MB × 5 tabs = 250MB worst-case, trivial on modern machines.
- **Closes**: #35 (with corrected unit from lines to bytes)
