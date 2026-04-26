## 1. Update chezmoi template

- [x] 1.1 Edit `dot_claude/settings.json.tmpl` to set `"effortLevel": "xhigh"` (lowercase)
- [x] 1.2 Add `"skipAutoPermissionPrompt": true` to the user-preference block
- [x] 1.3 Reorder the user-preference block to canonical order: `alwaysThinkingEnabled`, `skipDangerousModePermissionPrompt`, `skipAutoPermissionPrompt`, `voiceEnabled`, `effortLevel`
- [x] 1.4 Verify the resulting file is valid JSON (the template renders to JSON with chezmoi's `chezmoi cat` or equivalent)

## 2. Verify against the live machine

- [x] 2.1 Run `chezmoi diff dot_claude/settings.json.tmpl` and confirm the diff matches the intended template change (no unexpected reformatting)
- [x] 2.2 Run `chezmoi apply dot_claude/settings.json.tmpl` on this machine
- [x] 2.3 Confirm `~/.claude/settings.json` contains `"effortLevel": "xhigh"`, `"skipAutoPermissionPrompt": true`, and the canonical key order in the user-preference block

## 3. Sanity-check Claude Code accepts the values

- [x] 3.1 Restart a Claude Code session (or open a new one) and confirm no startup warning about unknown settings or invalid `effortLevel`
- [x] 3.2 Confirm `effortLevel` is not silently normalized back to `"high"` after the session starts

## 4. Close out

- [x] 4.1 Reference issue #129 in the commit/PR message
- [x] 4.2 After merge, run `/opsx:archive align-claude-user-preferences` to fold delta requirements into `openspec/specs/claude-user-preferences/spec.md`
