# Tasks

Verification steps that need deployed files: sync `~/.local/share/chezmoi` first (dual-dir layout), or run `chezmoi apply --source <this repo>`.

## 1. Install script

- [x] 1.1 Add `install_skill "greptileai/skills" "greploop"`, `"check-pr"`, and `"cli-review"` (each with `"claude-code opencode junie codex"`) after the tuicr call in `run_onchange_install-packages.sh.tmpl`; verify with `chezmoi execute-template < run_onchange_install-packages.sh.tmpl | bash -n`
- [x] 1.2 Add the three matching `npx -y skills add greptileai/skills --skill <name> -g -y --agent claude-code opencode junie codex` lines after the tuicr line in the non-macOS manual block, same order; verify by inspecting the rendered non-macOS output
- [x] 1.3 Run the group locally; verify all three report "already installed" (full agent coverage), then remove one with `npx skills remove -g greploop` and rerun to verify only it is reinstalled with all four agents in `npx skills list -g --json`
- [x] 1.4 Verify `~/.claude/settings.json` is byte-identical before and after the run

## 2. Docs

- [x] 2.1 Add `greploop`, `check-pr`, and `cli-review` rows to the skills table in `docs/manual.html` (via the docs:manual skill), noting `cli-review` needs the `greptile` CLI and the other two need `gh`; verify the section renders

## 3. Close

- [x] 3.1 Run the repo's lint/format gates and `openspec validate add-greptile-skills --strict`; verify both pass
