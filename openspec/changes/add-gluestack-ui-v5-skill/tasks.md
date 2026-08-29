## 1. Install script

- [x] 1.1 In `run_onchange_install-packages.sh.tmpl`, extend the `install_skill` helper inside Group 9 with an optional third argument (space-separated agent list) that is passed to `skills add` as `--agent <agents>` only when non-empty; verify the existing thirteen `install_skill` calls remain unchanged and the script passes `zsh -n`/equivalent syntax check.
- [x] 1.2 In the same Group 9 block, add `install_skill "gluestack/agent-skills" "gluestack-ui-v5" "claude-code opencode junie"` after the existing calls so it shares the confirmation prompt, the skills-list cache, and the error counter; verify the call renders correctly in the script (no chezmoi template breakage).

## 2. Non-macOS manual instructions

- [x] 2.1 In the non-macOS manual-instructions block, append the literal line `npx -y skills add gluestack/agent-skills --skill gluestack-ui-v5 -g -y --agent claude-code opencode junie` alongside the existing skill install commands (same section, not a new one).

## 3. Verification on macOS

- [x] 3.1 Run the agent-skills group of the install script (or the equivalent `skills add` command) and confirm `npx -y skills add gluestack/agent-skills --skill gluestack-ui-v5 -g -y --agent claude-code opencode junie` executes successfully.
- [x] 3.2 Check that `~/.agents/skills/gluestack-ui-v5/` exists and contains `SKILL.md` (shared-store staging).
- [x] 3.3 Check that `~/.claude/skills/gluestack-ui-v5` and `~/.junie/skills/gluestack-ui-v5` exist and resolve into `~/.agents/skills/gluestack-ui-v5` (symlink layout matching the other skills); confirm OpenCode discovers the skill (it appears in OpenCode's user-level skill list on a new session).
- [x] 3.4 Re-run the script; verify gluestack-ui-v5 is reported as already installed (idempotency via the cached `skills list -g --json`) and no second install is attempted.
- [x] 3.5 Verify `~/.claude/settings.json` was not modified during the run (checksum the live file before/after, or `chezmoi diff` stays clean for that path).
- [x] 3.6 If the observed layout differs from 3.2–3.3 (CLI behavior drift), adjust the invocation and record the finding in `design.md` before proceeding.

## 4. Documentation (skill-driven, proposals only)

- [x] 4.1 Invoke the `update-readme` skill and accept/reject its proposals — adding a skill to the install flow may count as a new tool in setup.
- [x] 4.2 Invoke the `update-manual` skill and accept/reject its proposals — the manual covers CLI/agent configuration, so a manual update is expected (precedent: slidev added a row to Section 11).

## 5. OpenSpec validation

- [x] 5.1 Run `bunx openspec validate add-gluestack-ui-v5-skill --strict` and resolve any findings.
- [x] 5.2 Run `bunx openspec list` to confirm the change is listed and well-formed.
