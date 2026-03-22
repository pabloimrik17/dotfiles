## 1. macOS install section

- [ ] 1.1 Add "Group 6: Agent skills (skills.sh)" section to `run_once_install-packages.sh.tmpl` after the Claude Code plugin dependencies group, with `confirm()` prompt and `npx` availability check
- [ ] 1.2 Add the six `npx -y skills add -g -y <repo>` commands wrapped in `run_claude_step` or equivalent error-handling pattern
- [ ] 1.3 Verify idempotency: the new group handles re-runs gracefully (CLI overwrites existing symlinks)

## 2. Non-macOS manual instructions

- [ ] 2.1 Add agent skills manual instructions to the non-macOS section listing all six `npx -y skills add -g -y <repo>` commands

## 3. Verification

- [ ] 3.1 Run the new group on the current machine and confirm `~/.claude/settings.json` is unchanged
- [ ] 3.2 Confirm skills are present in `~/.claude/skills/` and `~/.agents/skills/` after running
