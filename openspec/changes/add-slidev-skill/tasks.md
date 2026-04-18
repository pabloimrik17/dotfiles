## 1. Install script

- [ ] 1.1 Extend the agent-skills helper in `run_onchange_install-packages.sh.tmpl` (around lines 977–982) to accept an optional third `<agent>` argument that, when present, appends `--agent <agent>` to the `npx -y skills add` invocation — keep backward compatibility so existing `install_skill <repo> <name>` calls continue to work unchanged.
- [ ] 1.2 Inside the same `if confirm "Install global agent skills via skills.sh?"; then … fi` block, after the existing `install_skill` calls, add `install_skill "slidevjs/slidev" "slidev" "claude-code"` so Slidev reuses the shared confirmation prompt, shared skills-list cache, and shared error counter.
- [ ] 1.3 Add a one-line comment above the new call explaining why the agent is explicit (scope limited to Claude Code; OpenCode tracked separately in DOT-3) so future readers understand the asymmetry with the other calls.

## 2. Non-macOS manual instructions

- [ ] 2.1 In the non-macOS manual-instructions block (around lines 1048+), append the literal line `npx -y skills add slidevjs/slidev --skill slidev --agent claude-code -g -y` alongside the existing skill install commands.

## 3. Verification on macOS

- [ ] 3.1 Run `chezmoi apply` (or re-execute the install script directly) on a machine where Slidev is not yet installed, confirm the agent-skills group prompt, and verify the Slidev install executes successfully.
- [ ] 3.2 Check that `~/.claude/skills/slidev` symlink exists and resolves under `~/.agents/skills/slidev`.
- [ ] 3.3 Check that `~/.config/opencode/skills/slidev` and `~/.opencode/skills/slidev` do **not** exist (scope assertion from spec).
- [ ] 3.4 Re-run the script; verify Slidev is reported as already installed (idempotency) and no second install is attempted.
- [ ] 3.5 Verify `~/.claude/settings.json` was not modified during the run (e.g., `git diff` on chezmoi source shows no diff; or checksum the live file before/after).

## 4. Documentation (skill-driven, proposals only)

- [ ] 4.1 Invoke the `update-readme` skill and accept/reject its proposals — adding Slidev to the setup counts as a new tool in the install flow, so a README update is expected.
- [ ] 4.2 Invoke the `update-manual` skill and accept/reject its proposals — the manual covers Claude Code / CLI configuration, so a manual update is expected.

## 5. OpenSpec validation

- [ ] 5.1 Run `bunx openspec validate add-slidev-skill --strict` and resolve any findings.
- [ ] 5.2 Run `bunx openspec list` to confirm the change is listed and well-formed.
