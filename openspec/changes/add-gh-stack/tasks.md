## 1. Installation

- [x] 1.1 Add `gh-stack` to the gh CLI extensions group in `run_onchange_install-packages.sh.tmpl` (after the `gh-enhance` block, ~`:346`) using `gh extension install github/gh-stack`, with the same idempotency guard as its neighbours: `gh extension list 2>/dev/null | grep -qE '(^|[[:space:]])github/gh-stack([[:space:]]|$)'`, `info` on skip, `error` on failure
- [x] 1.2 Add the agent skill install next to the `cli/cli` skill block (`:348-357`) using `gh skill install github/gh-stack gh-stack --agent claude-code --scope user`, detecting an existing install via `gh skill list --agent claude-code --scope user --json skillName --jq '.[].skillName' | grep -qx "gh-stack"`
- [x] 1.3 Update the group's `confirm` prompt at `:329` so it names gh-stack alongside gh-dash and gh-enhance
- [x] 1.4 Update the non-macOS fallback summary at `:1193`, which lists only `gh-dash`, so it covers every extension the group installs — gh-dash, gh-enhance (missing today), and gh-stack

## 2. Shell alias

- [x] 2.1 Delete `alias gs="git status"` at `dot_zshrc.tmpl:233` (duplicate of the OMZ git plugin's `gst`)
- [x] 2.2 Add `alias gs="gh stack"` to the GitHub aliases section of `dot_zshrc.tmpl` (`:242-246`, after `ghe`)
- [x] 2.3 Confirm no `gs` executable is created under `dot_local/bin/` and that `gh stack alias` is never invoked by the install script

## 3. Documentation

- [x] 3.1 Add a `gh-stack` row to the README "What's Included" table under the **Git** category (`README.md:51-52`), linking to `https://github.com/github/gh-stack`
- [x] 3.2 Remove the `gs` → `git status` row from the git "Custom aliases" table in `docs/manual.html` (`:948-951`); the `gst` row at `:1155-1156` already documents `git status`
- [x] 3.3 Add a `gs` → `gh stack` row to the gh alias table in `docs/manual.html` (after `:1192`), matching the `ghd`/`ghe` row format
- [x] 3.4 Run the `docs:readme` and `docs:manual` skills to catch anything the manual edits above missed

## 4. Verification

- [x] 4.1 Run `chezmoi diff` to confirm the expected files are detected and no unintended changes appear — run as `chezmoi diff --source <worktree>`, since chezmoi's real source (`~/.local/share/chezmoi`) tracks `main` and cannot see this branch. Detected `.zshrc` (exactly the two alias lines) and `install-packages.sh` (script re-run). The other four entries (`.claude/settings.json`, aoe, opencode, `.tmux.conf`) are pre-existing local drift, untouched by this change
- [x] 4.2 After `chezmoi apply` and a fresh shell: `gh extension list` includes `github/gh-stack`, `gh stack --help` runs, `gh skill list --agent claude-code --scope user --json skillName --jq '.[].skillName'` includes `gh-stack` — all three verified. Installed by running the script's exact commands directly (extension `v0.1.0`, skill into `~/.claude/skills`) rather than via `chezmoi apply`, which cannot reach this branch's source until merge. Template also renders clean and passes `bash -n`
- [ ] 4.3 Confirm `alias gs` reports `gh stack`, `gst` still reports `git status`, and `command -v gs` finds no PATH executable — `whence -p gs` finds no PATH executable ✓; `gst` → `git status` from the OMZ git plugin (`git.plugin.zsh:240`) ✓. **Remaining:** `alias gs` still reports `git status` in live shells because the deployed `~/.zshrc` predates this change; confirm after merge + `chezmoi update` + `chezmoi apply` + a fresh shell
- [x] 4.4 Re-run the install script and confirm all three idempotency guards report "already installed" rather than reinstalling — all three guards executed directly against real state and each took the skip branch: `github/gh-stack` extension, `gh-stack` skill, and the existing `cli/cli` `gh` skill. The skill guard was also confirmed to correctly report "would install" *before* the install, so it is not a false positive
