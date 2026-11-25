# Tasks

## 1. CodeRabbit review skill as `coderabbit-review`

- [x] 1.1 Give `install_skill` an optional installed name (design D2) and install CodeRabbit's `code-review` as `coderabbit-review` in Group 9 and in the non-macOS list; verify with `tests/install-script.test.ts` that both renders carry `--skill code-review --rename coderabbit-review` and no unrenamed CodeRabbit `code-review` line.
- [x] 1.2 After the CodeRabbit line, re-read the skills list and remove the old `code-review` only when `coderabbit-review` is present and the entry comes from `coderabbitai/skills` with no `renamedFrom`; without `jq`, skip with a warning (design D3). Verify with a test that stubs `npx` for the four `coderabbit-skills` removal scenarios.
- [x] 1.3 Update the Purpose of `openspec/specs/coderabbit-skills/spec.md` to name `coderabbit-review` and `autofix`, and the CodeRabbit rows of `docs/manual.html`; verify `openspec validate --specs --strict` passes and `grep -n 'coderabbit-review' docs/manual.html` finds them.

## 2. Matt Pocock's `code-review` for OpenCode and Junie

- [x] 2.1 Add `code-review` to the Matt Pocock block with `opencode junie`, checked against a list re-read after any removal and skipped with a message while a `code-review` from another source remains (design D4); verify with `npx` stubs for "Old CodeRabbit copy still present" and "Old copy removed in the same run".
- [x] 2.2 Put `code-review` in the non-macOS Matt Pocock command (24 skills); verify with a test on `render("linux")`.
- [x] 2.3 Warn at the end of Group 9 when `~/.claude/skills/code-review` exists (design D5); verify with a test that runs the check against a temporary `HOME` with and without the link.
- [x] 2.4 Update `.agents/skills/sync-agent-config/parity.md` (24 skills, no CodeRabbit flat-name note, Matt Pocock's `code-review` kept out of Claude Code) and the flat-name text in `docs/manual.html`; verify that `grep -n 'CodeRabbit-owned' .agents/skills/sync-agent-config/parity.md docs/manual.html` finds nothing.

## 3. Official `code-review` plugin removed

- [x] 3.1 Drop `code-review@claude-plugins-official` from `CC_PLUGINS` and add `CC_PLUGINS_REMOVED`, counted in `PENDING_RT` and uninstalled in the post-install pass (design D6); verify with a test on the rendered arrays.
- [x] 3.2 Drop the plugin from the managed `enabledPlugins` in `dot_claude/modify_settings.json.tmpl` and add its `REMOVE` entry; verify with a settings test that a live file holding the key loses it and keeps every other `enabledPlugins` key.

## 4. Greptile CLI

- [x] 4.1 Add a Greptile group after fallow: skip when `greptile` is on PATH, warn and skip without `node`/`npm` or below Node 22, confirm, `npm install -g greptile`, count failures (design D7); verify with tests on the rendered group and with `greptile --version` on this Mac.
- [x] 4.2 Print `greptile login` (or `GREPTILE_API_KEY`) in the manual block and `npm install -g greptile` (Node 22+) in the non-macOS list; verify with tests on both renders, including that no brew tap, package or version row names Greptile.
- [x] 4.3 Add the Greptile CLI to `README.md` (AI Tooling) and `docs/manual.html` through the `update-readme` and `update-manual` skills; verify both files mention the `greptile` CLI and its login.

## 5. Integration

- [x] 5.1 Run `bun test`, `bun run lint:oxfmt` and `bun run lint:fallow`; verify all pass.
- [ ] 5.2 After merge, on the personal Mac run `chezmoi update` and the install script; verify the skills and Greptile steps change nothing, `claude plugin list` no longer shows `code-review@claude-plugins-official`, `~/.claude/settings.json` has no key for it, and a new Claude Code session lists the built-in `code-review`.
- [ ] 5.3 On the work Mac, with the old skill still installed, run the install script; verify `skills list -g` shows `coderabbit-review` (renamed from `code-review`) and Matt Pocock's `code-review` for OpenCode and Junie only, and that `~/.claude/skills/code-review` does not exist.

## Workflow follow-up

- Archive the change after merge.
- Beads `agentic-task-8817` drops `--rename` once coderabbitai/skills#83 merges.
- The follow-up Linear task deletes `dot_claude/commands/review-team.md` and points the `F` key, `ghd-aoe` and the claude shim at `/autonomous:review-team` once DOT-163 ships.
