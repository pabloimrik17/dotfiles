## 1. Install script — package list

- [x] 1.1 Append `mole` to the `BREW_PACKAGES` array in `run_onchange_install-packages.sh.tmpl` (26th entry, immediately after `age`)
- [x] 1.2 Confirm `BREW_TAPS` is unchanged — `mole` lives in `homebrew-core`
- [x] 1.3 Confirm `pkg_bin()` is unchanged — identity mapping returns `mole` from the default `*)` case (no new `case` arm)
- [x] 1.4 Update the closing summary `info "Installation complete!"` block: append `mole` to the `CLI tools:` comma-separated list after `age`
- [x] 1.5 Confirm the non-macOS branch (`{{ else -}}`) is unchanged — no `mole` mention is added; the existing `{{ if eq .chezmoi.os "darwin" }}` guard filters macOS-only tools natively

## 2. Install & validate on host

- [x] 2.1 Run `chezmoi apply` (or trigger `run_onchange_install-packages.sh.tmpl` directly) and confirm the brew packages prompt reports `mole` as pending on first run
- [x] 2.2 After install, verify `command -v mole` returns the brew Cellar path and `mole --version` (or equivalent) succeeds
- [x] 2.3 Re-run `chezmoi apply` and confirm the script logs `mole — already installed, skipping` (idempotency)
- [x] 2.4 Smoke-test: launch `mole`, confirm the interactive TUI menu renders, exit without running any cleanup action

## 3. OpenSpec validation

- [x] 3.1 `openspec validate add-mole` returns "Change 'add-mole' is valid"
- [x] 3.2 `git status` shows only the expected modifications: `run_onchange_install-packages.sh.tmpl`, the OpenSpec change directory `openspec/changes/add-mole/`, and the docs files updated in task group 4
- [x] 3.3 `git diff --no-color` shows no unrelated edits (no other CLIs added/removed, no tap changes, no `pkg_bin` arm)

## 4. Documentation

- [x] 4.1 Run the `update-readme` skill: add `mole` to `README.md`'s "What's Included" table under CLI Tools with a brief description ("Deep clean and optimize your Mac — caches, logs, app remnants, `node_modules`") and macOS-only badge if the table uses one
- [x] 4.2 Run the `update-manual` skill: add a "Mac cleanup (mole)" subsection to the relevant section of `docs/manual.html`, documenting the invocation (`mole` to launch the TUI), the macOS-only scope, and the safety note that `mole` actions are destructive and always user-initiated
- [x] 4.3 Verify README and manual stay consistent: README is the discovery surface (one-line entry), manual is the daily-use reference (invocation + caveat) — no duplication beyond the tool name
