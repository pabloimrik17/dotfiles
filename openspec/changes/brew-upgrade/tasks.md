## 1. Install-method migration (opencode + CodeRabbit → official installers)

- [ ] 1.1 Remove `opencode` from the `BREW_PACKAGES` array in `run_onchange_install-packages.sh.tmpl` (no `pkg_bin` change needed; it used identity mapping)
- [ ] 1.2 Remove the `coderabbit|CodeRabbit|AI|AI code review CLI` entry from the `ALL_CASKS` array
- [ ] 1.3 Add a new install group (after the brew-packages group) that installs opencode via `curl -fsSL https://opencode.ai/install | bash --no-modify-path`, with: brew-migration (`brew list opencode` → `brew uninstall opencode`, optional `brew untap anomalyco/tap`), idempotency (`command -v opencode` under `~/.opencode/bin` → skip), no `sudo`, and `export PATH="$HOME/.opencode/bin:$PATH"` afterward so later groups detect it
- [ ] 1.4 In the same group, install CodeRabbit via `CI=1 curl -fsSL https://cli.coderabbit.ai/install.sh | sh`, with: cask-migration (`brew list --cask coderabbit` → `brew uninstall --cask coderabbit` WITHOUT `--zap`), idempotency (`command -v coderabbit` under `~/.local/bin` → `coderabbit update`), `hash -r` after migration
- [ ] 1.5 Update the non-macOS fallback branch: drop `opencode` from the brew package list and add it under the official-installer instructions
- [ ] 1.6 Add `export PATH="$HOME/.opencode/bin:$PATH"` to `dot_zshrc.tmpl` (near the existing `~/.local/bin` PATH line)

## 2. Upgrade follow-ups (config hygiene)

- [ ] 2.1 In `dot_zshrc.tmpl` (~line 92), remove `export OPENCODE_EXPERIMENTAL_MARKDOWN=true`; leave the other four `OPENCODE_EXPERIMENTAL_*` / `OPENCODE_ENABLE_EXA` exports intact
- [ ] 2.2 In the manual-instructions block (~line 1045), reword the CodeRabbit auth line for 0.5.0 deferred login (auth on first use; keep `coderabbit auth login`; optionally mention `coderabbit auth org`) and add a `coderabbit doctor` setup-verification line

## 3. Apply + brew upgrade + operational sequencing

- [ ] 3.1 Run `chezmoi diff` to confirm intended changes, then `chezmoi apply` (the `run_onchange` script re-runs and migrates opencode/CodeRabbit off brew)
- [ ] 3.2 Run `brew upgrade` for the remaining tools
- [ ] 3.3 Upgrade beads + dolt together; confirm `beads` stays unpinned; coordinate across every machine sharing a `.beads` DB/remote within one window (beads 1.0.5 migrations are irreversible + schema-skew-guarded)
- [ ] 3.4 Start a new shell; confirm no worktrunk directive-file deprecation warning (0.54 split wrapper auto-adopted)

## 4. Verification

- [ ] 4.1 `command -v opencode` resolves to `~/.opencode/bin/opencode`; `command -v coderabbit` resolves to `~/.local/bin/coderabbit`; `cr` symlink present
- [ ] 4.2 `BREW_PACKAGES` no longer contains `opencode`; `ALL_CASKS` no longer contains `coderabbit`; `brew list opencode` and `brew list --cask coderabbit` both fail
- [ ] 4.3 `grep OPENCODE_EXPERIMENTAL_MARKDOWN dot_zshrc.tmpl` returns nothing; the other four flags still present; `~/.opencode/bin` PATH line present
- [ ] 4.4 opencode launches and self-update is active (config `autoupdate` default true, not a brew install); `coderabbit doctor` passes; `bd prime` works after the beads/dolt bump
- [ ] 4.5 `openspec validate brew-upgrade` passes

## 5. Docs sync

- [ ] 5.1 If `docs/manual.html` or `README.md` reference how opencode/CodeRabbit are installed, the OpenCode env flags, or the CodeRabbit auth step, run the update-manual / update-readme skill to sync them
