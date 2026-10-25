## Why

Agents can miss the comment-writing skill before writing their first comment. A short trigger in the canonical repository instructions makes the skill discoverable at the point of use.

## What Changes

- Add the exact comment-writing skill instruction once in root `AGENTS.md`.
- Remove the standalone Bun-only sentence identified in review, retaining the command-equivalence table.
- Keep the policy in the installed skill and retain the existing repository-only instruction boundary.
- Remove the proposed global `dot_claude/CLAUDE.md` and parity-table addition, as requested in review.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `agent-instructions`: require the repository comment-writing trigger and align canonical instruction content with the reviewed removal of the standalone Bun sentence.

## Impact

Only repository instructions and this OpenSpec change are affected. Host instruction files, plugin settings, package-manager configuration, and parity mappings remain unchanged. This records the implementation already completed for Beads `agentic-task-cc0`.
