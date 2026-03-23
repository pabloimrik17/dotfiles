## 1. macOS install section

- [ ] 1.1 Add "Group 6: Agent skills (skills.sh)" section to `run_once_install-packages.sh.tmpl` after the Claude Code plugin dependencies group, with `confirm()` prompt and `npx` availability check
- [ ] 1.2 Query installed skills via `npx -y skills list -g --json` and parse with available tooling to detect already-installed skills
- [ ] 1.3 Add the ten `npx -y skills add <repo> --skill <name> -g -y` commands with skip-if-installed checks, using `run_claude_step` or equivalent error-handling pattern

## 2. Non-macOS manual instructions

- [ ] 2.1 Add agent skills manual instructions to the non-macOS section listing all ten individual `npx -y skills add <repo> --skill <name> -g -y` commands

## 3. Verification

- [ ] 3.1 Run the new group on the current machine and confirm `~/.claude/settings.json` is unchanged
- [ ] 3.2 Confirm exactly the 10 expected skills are present in `~/.claude/skills/` and `~/.agents/skills/` after running
- [ ] 3.3 Re-run the group and confirm already-installed skills are skipped
