## Why

The chezmoi-managed template `dot_claude/settings.json.tmpl` has drifted from the desired Claude Code user-preference state. It is missing `skipAutoPermissionPrompt`, has a stale `effortLevel` value (`"high"` instead of the intentional `"xhigh"`), and the key order does not match the live `~/.claude/settings.json`. Without alignment, `chezmoi apply` would silently downgrade reasoning effort, re-introduce a permission prompt that was deliberately disabled, and produce noisy diffs on every UI toggle.

## What Changes

- Add `"skipAutoPermissionPrompt": true` to the user-preference block in `dot_claude/settings.json.tmpl`.
- Set `"effortLevel": "xhigh"` (lowercase — the only value the Claude Code settings schema accepts; `xHigh` is rejected and normalized to `"high"`).
- Reorder the user-preference top-level keys to a canonical sequence — `alwaysThinkingEnabled`, `skipDangerousModePermissionPrompt`, `skipAutoPermissionPrompt`, `voiceEnabled`, `effortLevel` — so that future template ↔ live diffs are stable.
- Encode the effort-level value, the `skipAutoPermissionPrompt` flag, and the canonical key order as new requirements in the `claude-user-preferences` capability.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `claude-user-preferences`: adds requirements for `effortLevel` value, `skipAutoPermissionPrompt`, and canonical pref-key ordering. Existing requirements (`alwaysThinkingEnabled`, `voiceEnabled`, `skipDangerousModePermissionPrompt`, all permissions rules) remain unchanged.

## Impact

- File: `dot_claude/settings.json.tmpl` — small edit to the top-level user-preference block (1 added key, 1 changed value, reorder of 4-now-5 lines).
- Spec: `openspec/specs/claude-user-preferences/spec.md` — 3 new requirements added via delta.
- Runtime: next `chezmoi apply` writes `xhigh` and `skipAutoPermissionPrompt: true` to `~/.claude/settings.json`. No tooling, migration, or backwards-compatibility concerns.
- Risk: Claude Code rewrites this file on UI toggles and may scramble key order, partially undoing the canonical ordering. The spec requirement governs what the template writes; round-trip stability with the live runtime is best-effort and out of scope.
- Closes GitHub issue [#129](https://github.com/pabloimrik17/dotfiles/issues/129).
