# Tasks: add-extra-updates-command

## 1. update-extra function

- [x] 1.1 Add `_update_extra_step` helper and `update-extra` function to the aliases section of `dot_zshrc.tmpl` (before the zoxide init at the end), with `unalias update-extra 2>/dev/null` guard
- [x] 1.2 Wire the six steps with the exact commands from design D4 (gh extensions, you-should-use `--ff-only`, skills.sh `-g -y`, plannotator installer, 4 Catppuccin assets + `bat cache --build`, `tv update-channels`)
- [x] 1.3 Verify in a fresh interactive zsh: full run prints per-step label + ✓/✗ and summary; force one step to fail and confirm remaining steps run and exit code is non-zero

## 2. classify-tool-updates skill

- [x] 2.1 Create `.claude/skills/classify-tool-updates/SKILL.md` following the `update-manual` structure (When This Activates / Workflow / propose-then-confirm / Guardrails), encoding the four-way classification tree, the one-line step add/remove proposal for `update-extra`, and docs delegation to `update-manual`/`update-readme`

## 3. Docs

- [x] 3.1 Run the `update-manual` skill: add the `update-extra` workflow to docs/manual.html (§8 Brew/maintenance area)
- [x] 3.2 Run the `update-readme` skill: assess whether README daily workflows need an `update-extra` mention

## 4. Sync and validation

- [ ] 4.1 `chezmoi update` on the live machine (dev clone ≠ chezmoi source dir) and confirm `update-extra` is available in a new shell
- [ ] 4.2 `openspec validate add-extra-updates-command` passes; run `/opsx:verify` before archiving
