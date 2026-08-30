# Tasks: install-matt-pocock-skills

## 1. Claude Code Plugin

- [x] 1.1 Add `mattpocock-skills@claude-plugins-official` to the Group 8 `CC_PLUGINS` array in `run_onchange_install-packages.sh.tmpl`; verify the rendered array contains the plugin exactly once and `CC_MARKETPLACES` remains unchanged.
- [x] 1.2 Add `"mattpocock-skills@claude-plugins-official": true` to `enabledPlugins` in `dot_claude/modify_settings.json.tmpl`, alphabetically between `frontend-design@claude-plugins-official` and `plannotator@plannotator`; render and execute the modify script over `{}` and verify the result is valid JSON with that key enabled and `extraKnownMarketplaces.claude-plugins-official.autoUpdate` still `true`.
- [x] 1.3 Add the official plugin install command to the non-macOS Claude Code fallback in `run_onchange_install-packages.sh.tmpl`; verify rendered fallback output contains `claude plugin install mattpocock-skills@claude-plugins-official` and no new marketplace-add command.

## 2. Scoped Standalone Skills

- [x] 2.1 Extend Group 9 in `run_onchange_install-packages.sh.tmpl` so each selected skill installs through the existing `install_skill` helper with the agent list `opencode junie`; verify a name already covering both agents is skipped and an install failure can be recorded without stopping later skill calls.
- [x] 2.2 Add calls for the 24 selected `mattpocock/skills` names from `specs/matt-pocock-skills/spec.md`; inspect the rendered script and verify every selected name appears once in the managed call list, every resulting add command is global and non-interactive, and no Matt call selects `code-review`, `*`, or `claude-code`.
- [x] 2.3 Add one non-macOS fallback skills.sh command with repeatable `--skill` arguments for the same 24 names and explicit `--agent opencode junie` scope; compare its sorted selection with the Group 9 selection and verify both sets are identical and exclude `code-review`.
- [x] 2.4 Re-read the implementation diff and verify it adds no direct OpenCode or Junie symlink management, no Matt-specific update step in `dot_zshrc.tmpl`, no Renovate version pin, and no automatic removal of existing user-managed skills.

## 3. Parity And Documentation

- [x] 3.1 Add a row to `.agents/skills/sync-agent-config/parity.md` recording Claude Code's official namespaced plugin, OpenCode's scoped skills.sh exposure, Junie's scoped skills.sh exposure, and the flat `code-review` exception; verify all five table cells are populated.
- [x] 3.2 Invoke the `update-manual` skill for the new plugin and standalone skill distribution, apply or explicitly dismiss its proposed `docs/manual.html` edits, and verify the documented counts and update mechanisms match the rendered configuration.
- [x] 3.3 Invoke the `update-readme` skill for the same distribution, apply or explicitly dismiss its proposed `README.md` edits, and verify any resulting skill table or setup guidance distinguishes plugin auto-updates from `update-extra` global-skill updates. **Dismissed: `README.md` stays unmodified.** It enumerates no individual skills or plugins, its only related line is the generic `update-extra` mention at `README.md:183`, and it names neither Matt Pocock nor this distribution — which is documented instead in the manual's "Matt Pocock skills" table (task 3.2).

## 4. Static Verification

- [x] 4.1 Render `run_onchange_install-packages.sh.tmpl` with `chezmoi execute-template`, run `bash -n` on the output, and verify the plugin, 24-skill selection, two agent targets, and fallback commands survive rendering.
- [x] 4.2 Render `dot_claude/modify_settings.json.tmpl` to a temporary modify script, merge it over JSON containing an unrelated sentinel key, and verify with a JSON parser that the sentinel is preserved, the Matt plugin is enabled, the official marketplace remains auto-updating, and no duplicate marketplace is introduced.
- [x] 4.3 Run `chezmoi diff --source "$PWD"` from the implementation worktree and verify the diff is limited to the intended install template, Claude settings, parity table, and any accepted README/manual updates; specifically confirm `dot_zshrc.tmpl` is unchanged.

## 5. Live Integration Verification

- [ ] 5.1 **Requires an interactive TTY; only a human in a real terminal can complete this.** Run `chezmoi apply --source "$PWD"` twice against the render produced after `6afe6ba`/`7f2efb2` (last apply recorded script hash `808ad147f04d…`, current render is `93076ca72fed…`, so the `run_onchange` is still pending) and verify the second run reports the Matt plugin and all 24 selected standalone skill names as already installed, or otherwise performs no duplicate installation. Never run it from a TTY-less agent: `confirm()` uses `read -r reply </dev/tty` and, with no TTY, warns "No TTY available … defaulting to no" and returns 1 — every install group is skipped while chezmoi still records the script as executed in `scriptState`, falsely marking the `run_onchange` done.
- [x] 5.2 Verify `claude plugin list --json` contains `mattpocock-skills@claude-plugins-official`, Claude Code exposes the plugin-namespaced skill collection including `mattpocock-skills:code-review`, and no selected Matt standalone skill is newly exposed through `~/.claude/skills`.
- [x] 5.3 Inspect `npx -y skills list -g --json` and verify all 24 selected names are sourced from `mattpocock/skills` with OpenCode and Junie exposure, while flat `code-review` remains sourced from `coderabbitai/skills`.
- [x] 5.4 Inspect `~/.agents/skills` and `~/.junie/skills` and verify each of the 24 selected Matt skills exists once as a canonical body and once as a Junie symlink resolving to that body; OpenCode is a skills.sh universal agent (`skillsDir: ".agents/skills"`), so it reads the canonical directory directly and `~/.config/opencode/skills` stays empty by design. Then verify none of the 24 appears under `~/.claude/skills`; if stale Matt standalone links exist there, report them and the scoped `npx skills remove -g --agent claude-code --skill <name> -y` remediation without running it or including `code-review`.
- [x] 5.5 Run the existing `update-extra` skills.sh globals step and verify the Matt standalone records participate without a Matt-specific command, then confirm `claude-plugins-official` still has marketplace auto-updates enabled for the plugin.
