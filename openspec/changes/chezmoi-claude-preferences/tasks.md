## 1. Add user preferences to chezmoi template

- [ ] 1.1 Add `alwaysThinkingEnabled`, `voiceEnabled`, and `skipDangerousModePermissionPrompt` as `true` to `dot_claude/settings.json.tmpl`, grouped near `effortLevel`

## 2. Verify

- [ ] 2.1 Run `chezmoi diff` to confirm the template produces the expected output with all three new keys
- [ ] 2.2 Validate rendered JSON contains `alwaysThinkingEnabled`, `voiceEnabled`, and `skipDangerousModePermissionPrompt` set to `true` via `chezmoi execute-template` piped to `jq`
