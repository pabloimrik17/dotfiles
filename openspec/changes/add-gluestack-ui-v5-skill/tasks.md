## 1. Install script

- [x] 1.1 In `run_onchange_install-packages.sh.tmpl`, extend the `install_skill` helper inside Group 9 with an optional third argument (space-separated agent list) that is passed to `skills add` as `--agent <agents>` only when non-empty; verify the existing thirteen `install_skill` calls remain unchanged and the script passes `zsh -n`/equivalent syntax check.
- [x] 1.2 In the same Group 9 block, add `install_skill "gluestack/agent-skills" "gluestack-ui-v5" "claude-code opencode junie codex"` after the existing calls so it shares the confirmation prompt, the skills-list cache, and the error counter; verify the call renders correctly in the script (no chezmoi template breakage).
- [x] 1.3 Make `skill_installed` coverage-aware: skip only when the cached `skills list -g --json` entry has the skill's `name` AND every requested agent slug maps via `skill_agent_display` (e.g. `claude-code`→`Claude Code`, `opencode`→`OpenCode`, `junie`→`Junie`, `codex`→`Codex`) to a display name present in that entry's `agents` array; verify the `jq`-absent path falls back to the previous name-only match.

## 2. Non-macOS manual instructions

- [x] 2.1 In the non-macOS manual-instructions block, append the literal line `npx -y skills add gluestack/agent-skills --skill gluestack-ui-v5 -g -y --agent claude-code opencode junie codex` alongside the existing skill install commands (same section, not a new one).

## 3. Verification on macOS

- [x] 3.1 Render the agent-skills group of the install script and confirm it produces the exact command `npx -y skills add gluestack/agent-skills --skill gluestack-ui-v5 -g -y --agent claude-code opencode junie codex`; if the equivalent `skills add` command is executed manually, confirm it succeeds.
- [x] 3.2 Check that `~/.agents/skills/gluestack-ui-v5/` exists and contains `SKILL.md` (shared-store staging).
- [x] 3.3 Check that `~/.claude/skills/gluestack-ui-v5` and `~/.junie/skills/gluestack-ui-v5` exist and resolve into `~/.agents/skills/gluestack-ui-v5` (symlink layout matching the other skills); confirm OpenCode discovers the skill and `npx -y skills list -g --agent codex --json` reports it for Codex through the global store.
- [x] 3.4 Re-run the script; verify gluestack-ui-v5 with full agent coverage is reported as already installed (idempotency via the cached `skills list -g --json`) and skipped, while a rerun missing an agent target re-runs `skills add` to reconcile coverage.
- [x] 3.5 Verify `~/.claude/settings.json` was not modified during the run (checksum the live file before/after, or `chezmoi diff` stays clean for that path).
- [x] 3.6 Record the observed Codex layout in `design.md`: Codex resolves the skill from the shared global store, so no dedicated symlink under `~/.codex/skills/` is required.

## 4. Documentation (skill-driven, proposals only)

- [x] 4.1 Invoke the `update-readme` skill and accept/reject its proposals — adding a skill to the install flow may count as a new tool in setup.
- [x] 4.2 Invoke the `update-manual` skill and update the existing gluestack-ui-v5 row in Section 11 so its agent list includes Codex.

## 5. OpenSpec validation

- [x] 5.1 Run `bunx openspec validate add-gluestack-ui-v5-skill --strict` and resolve any findings.
- [x] 5.2 Run `bunx openspec list` to confirm the change is listed and well-formed.
