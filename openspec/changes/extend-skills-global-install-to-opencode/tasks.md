## 1. Install script — core changes

- [x] 1.1 Extend `install_skill` in group 9 of `run_onchange_install-packages.sh.tmpl` so that, after a successful `skills add` (and also when the skill is already present), it creates `~/.config/opencode/skills/` with `mkdir -p` and runs `ln -sf "$HOME/.claude/skills/<name>" "$HOME/.config/opencode/skills/<name>"`.
- [x] 1.2 Ensure the symlink is NOT created when `skills add` fails (`run_claude_step` error flow).
- [x] 1.3 Append the line `install_skill "slidevjs/slidev" "slidev"` to the end of the group 9 list.

## 2. Non-macOS manual instructions

- [x] 2.1 In the manual instructions section (the template's `{{ else }}` branch), add the install command for slidev: `npx -y skills add slidevjs/slidev --skill slidev -g -y`.
- [x] 2.2 Add an "Expose skills to OpenCode" block that lists, for all eleven skills, the command `ln -sf "$HOME/.claude/skills/<name>" "$HOME/.config/opencode/skills/<name>"` (including the preceding `mkdir -p`).

## 3. Verification

- [x] 3.1 Run `chezmoi diff` on the template to confirm the presence (not exact counts) of: the `install_skill "slidevjs/slidev" "slidev"` line, the `mkdir -p "$HOME/.config/opencode/skills"` + `ln -sfn`/`-shf` block inside `install_skill`, and the platform detection via `uname`.
- [x] 3.2 Run `chezmoi apply` (a real run in a test environment) and verify that after execution `~/.claude/skills/slidev/SKILL.md` exists and `~/.config/opencode/skills/slidev` is a valid symlink to that directory.
- [x] 3.3 Verify idempotency: run `run_onchange` twice in a row and confirm the symlinks remain intact and already-installed skills are not reinstalled.
- [x] 3.4 Verify the retrofit: on a machine with `~/.claude/skills/pdf/` but without `~/.config/opencode/skills/pdf`, run the script and confirm the symlink appears.

## 4. Docs (optional, evaluate at the end)

- [x] 4.1 Review `docs/manual.html` with the `docs:manual` skill and propose a line in the relevant OpenCode/skills section explaining that global skills appear symlinked in `~/.config/opencode/skills/`.
- [x] 4.2 Review `README.md` with `docs:readme` and decide whether it deserves a mention in the "What's Included" table or whether to omit it (likely omitted as an internal detail).

## 5. OpenSpec validation

- [x] 5.1 `openspec validate extend-skills-global-install-to-opencode` passes with no warnings or errors.
- [x] 5.2 `openspec verify extend-skills-global-install-to-opencode` passes (all scenarios satisfied by the implementation).
