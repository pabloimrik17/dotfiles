# Tasks: add-llmfit

## 1. Install script

- [x] 1.1 Add `AlexsJones/llmfit` as the third entry of `BREW_TAPS` in `run_onchange_install-packages.sh.tmpl`; verify the array reads `(tarkah/tickrs achannarasappa/tap AlexsJones/llmfit)`
- [x] 1.2 Append `AlexsJones/llmfit/llmfit` to `BREW_PACKAGES` after `mdfried`, never the bare `llmfit` (design D1, D2); verify the array parses to exactly 29 entries with `bash -c 'source <(sed -n "/^BREW_PACKAGES=/p" …); echo ${#BREW_PACKAGES[@]}'` or an equivalent read
- [x] 1.3 Add a `pkg_bin` case arm `AlexsJones/llmfit/llmfit) echo "llmfit" ;;` alongside the `git-delta`/`ripgrep`/`worktrunk`/`beads`/`television` arms; verify `pkg_bin "AlexsJones/llmfit/llmfit"` returns `llmfit` when the function is sourced in isolation
- [x] 1.4 Add `llmfit` after `mdfried` to the closing `CLI tools:` line of the macOS `info "Installation complete!"` block; verify the rendered line contains the token `llmfit` and not the qualified formula name
- [x] 1.5 Add an llmfit entry to the "Manual Installation Required" section describing the one-time switch off the `homebrew/core` formula (`brew uninstall llmfit && brew install AlexsJones/llmfit/llmfit`) and why (no `x86_64` macOS bottle → source build); verify it prints in the macOS branch
- [x] 1.6 Add `llmfit` to the non-macOS `CLI tools:` list plus an annotated `- llmfit:` line naming `brew install AlexsJones/llmfit/llmfit` and the `uv tool install -U llmfit` fallback, with no macOS-only notice; verify by rendering the template with `chezmoi execute-template` under a non-darwin OS value
- [x] 1.7 Confirm the change adds nothing else: no `dot_config/llmfit/`, no `custom_models.json`, no `LLMFIT_CUSTOM_MODELS`/`OLLAMA_CONTEXT_LENGTH` export, no `update-extra` step, no alias or hook invoking `llmfit` (design D4, D5); verify with a repo-wide search for `llmfit` that returns only the install script and docs

## 2. Docs

- [x] 2.1 Update `README.md` via the `update-readme` skill — add a `**CLI Tools**` row linking `https://github.com/AlexsJones/llmfit` and describing it as right-sizing LLM models to the machine's RAM/CPU/GPU; verify the row sits with the other CLI Tools rows and the table renders
- [x] 2.2 Update `docs/manual.html` via the `update-manual` skill — entry leading with the bare `llmfit` TUI, then `fit` / `recommend --json` / `info` / `doctor` as the scriptable surface, and a note that the tool is installed from the `AlexsJones/llmfit` tap; verify the page renders and the entry matches the surrounding CLI-tool entries

## 3. Verification

- [x] 3.1 Run the brew group on this host (already carrying core's `llmfit`) and confirm it reports `AlexsJones/llmfit/llmfit — already installed, skipping`, performs no `brew install`, and does not uninstall, unlink or relink anything (design D3)
- [x] 3.2 Confirm the brew group is a no-op on a second run without running `chezmoi apply` — this branch is not in the applied chezmoi source (`chezmoi source-path` → `~/.local/share/chezmoi`); verify by rendering the template with `chezmoi execute-template` and replaying the pre-scan: `BREW_PENDING=1/29`, the only pending entry `uv` (a pre-existing unlinked keg, unrelated), llmfit resolving to `already installed, skipping` with no `brew install`; and by `chezmoi state dump`, whose `scriptState` is keyed by script content hash, so an unchanged render never re-executes
- [x] 3.3 Confirm `brew tap` is idempotent for the new entry: re-run on the tapped host and check `brew tap AlexsJones/llmfit` exits 0 without a warning
- [x] 3.4 Confirm the tap formula resolves and is prebuilt without touching the host: `brew info AlexsJones/llmfit/llmfit` reports the tap as source and the formula declares no build dependencies
- [x] 3.5 Document the one-time migration off core's formula (`brew uninstall llmfit && brew install AlexsJones/llmfit/llmfit`) and deliberately leave it unperformed — this change never touches an existing `llmfit` (design D3); verify the two commands print in the script's "Manual Installation Required" block and appear in design.md's Migration Plan, and that nothing in this change runs them
- [x] 3.6 Run `openspec validate add-llmfit --strict` and confirm the change validates with both spec deltas recognised
- [x] 3.7 Confirm Homebrew 6's trust gate does not block the install (design D7): `brew tap AlexsJones/llmfit` exits non-zero on an untapped host and rolls the clone back, `brew install AlexsJones/llmfit/llmfit` still resolves the tap formula and registers the tap, and a subsequent `brew tap AlexsJones/llmfit` exits 0 without re-fetching the tap, though brew may still refresh its API data on the first call of a session
- [x] 3.8 Confirm the tap formula is valid and matches the shape design D1 and the Context "The tap." bullet describe (no `depends_on`, prebuilt tarball + `bin.install`; the version itself is not pinned by this repo — brew owns it): `ruby -c` passes on `Formula/llmfit.rb`, it declares no `depends_on`/`uses_from_macos`, and `homebrew/core`'s bottle tags still exclude `x86_64` macOS
