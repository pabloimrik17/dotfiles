## 1. Install script

- [x] 1.1 In `run_onchange_install-packages.sh.tmpl`, inside the existing `if confirm "Install global agent skills via skills.sh?"; then … fi` block, add `install_skill "slidevjs/slidev" "slidev"` after the existing `install_skill` calls, reusing the two-argument helper unchanged so Slidev shares the confirmation prompt, the skills-list cache, and the error counter.

## 2. Non-macOS manual instructions

- [x] 2.1 In the non-macOS manual-instructions block, append `npx -y skills add slidevjs/slidev --skill slidev -g -y` alongside the existing skill install commands.

## 3. Verification on macOS

- [x] 3.1 Uninstall the pre-existing Slidev skill with `npx -y skills remove slidev -g -y` (to erase the agent-scoped install performed during the earlier draft), then re-execute the install script and confirm the Slidev install runs successfully under the aligned call.
- [x] 3.2 Check that `~/.claude/skills/slidev` is a symlink pointing to `../../.agents/skills/slidev` — matching the layout of the other skills in the group.
- [x] 3.3 Check that `~/.config/opencode/skills/slidev` and `~/.opencode/skills/slidev` do **not** exist (scope assertion from spec).
- [x] 3.4 Re-run the script; verify Slidev is reported as already installed (idempotency) and no second install is attempted.
- [x] 3.5 Verify `~/.claude/settings.json` was not modified during the run (e.g., `git diff` on chezmoi source shows no diff; or checksum the live file before/after).

## 4. Documentation (skill-driven, proposals only)

- [x] 4.1 Invoke the `update-readme` skill and accept/reject its proposals — adding Slidev to the setup counts as a new tool in the install flow, so a README update is expected. (Outcome: no changes — agent skills are not in the README's tool table by convention; the existing 12 peers are also absent.)
- [x] 4.2 Invoke the `update-manual` skill and accept/reject its proposals — the manual covers Claude Code / CLI configuration, so a manual update is expected. (Outcome: added `slidev` row to Section 11 → "Skills auto-triggered", matching the precedent set by `frontend-design`.)

## 5. OpenSpec validation

- [x] 5.1 Run `bunx openspec validate add-slidev-skill --strict` and resolve any findings.
- [x] 5.2 Run `bunx openspec list` to confirm the change is listed and well-formed.
