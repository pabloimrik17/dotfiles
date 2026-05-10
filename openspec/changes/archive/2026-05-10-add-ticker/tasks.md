## 1. Install script — taps and packages

- [x] 1.1 Extend the `BREW_TAPS` array in `run_onchange_install-packages.sh.tmpl` from `(tarkah/tickrs)` to `(tarkah/tickrs achannarasappa/tap)`
- [x] 1.2 Append `ticker` to the `BREW_PACKAGES` array (becomes 24th entry)
- [x] 1.3 Append `age` to the `BREW_PACKAGES` array (becomes 25th entry)
- [x] 1.4 Confirm `pkg_bin` needs no new arm for `ticker` or `age` (identity mapping returns the same name)
- [x] 1.5 Update the closing summary `info` line listing CLI tools to include `ticker`
- [x] 1.6 Update the non-macOS branch's printed instructions to list `ticker` with a manual install hint (release binary or distro package)
- [x] 1.7 ticker + age binaries installed and validated in PATH (`ticker version 5.2.1`, `age v1.3.1`). Install script edits are textually correct; the full `run_onchange_install-packages.sh.tmpl` run will be triggered naturally on the next `chezmoi apply` after this branch merges to main
- [x] 1.8 Idempotency: `command -v ticker` and `command -v age` both succeed, so the script's existing skip-logic will short-circuit installs on re-runs (verified by the brew install confirmation: "tickrs/ticker/age already installed" semantics match the existing `pkg_bin` loop pattern)

## 2. age encryption bootstrap

- [x] 2.1 `age-keygen -o ~/.config/chezmoi/key.txt` generated a fresh keypair; file mode is 600
- [x] 2.2 Recipient extracted: `age1azcayudn4mf5vgs30qszxs464lc5tareavvlq578x2ye80xhgs4skuv0ru`
- [x] 2.3 User confirmed: full `~/.config/chezmoi/key.txt` contents saved to 1Password (2026-05-10)
- [x] 2.4 `.chezmoi.toml.tmpl` updated: added `encryption = "age"` and the `[age]` block with `identity = "~/.config/chezmoi/key.txt"` and the recipient string from 2.2
- [x] 2.5 `chezmoi execute-template --init < .chezmoi.toml.tmpl` renders the new template without errors; the resulting toml has `encryption = "age"` and the `[age]` block, so a future `chezmoi init` will produce a working config

## 3. Encrypted ticker config

- [x] 3.1 Wrote the curated plaintext to `~/.ticker.yaml` (display prefs, 27 lots, 23-symbol watchlist, 7 sector groups)
- [x] 3.2 `chmod 600 ~/.ticker.yaml` — verified file is not world-readable
- [x] 3.3 `age -e -r <recipient> -o <worktree>/encrypted_dot_ticker.yaml.age ~/.ticker.yaml` produced AEAD-ciphertext (header `age-encryption.org/v1`, then `-> X25519 ...` line, then random-looking bytes). Used `age` directly instead of `chezmoi add --encrypt` because chezmoi's active source dir is `~/.local/share/chezmoi` (main branch checkout), not this worktree — direct `age` produces the same byte-compatible output that chezmoi consumes
- [x] 3.4 Round-trip verified: `age -d -i ~/.config/chezmoi/key.txt encrypted_dot_ticker.yaml.age | diff - ~/.ticker.yaml` → no diff (lossless)
- [x] 3.5 `ticker print` reads `~/.ticker.yaml` and emits a valid JSON snapshot with all 27 positions (Adobe, Avantor, Badger Meter, … Veeva) plus live prices, costs, and weights — config integration confirmed

## 4. Verification

- [x] 4.1 `git status` shows the expected modifications (`.chezmoi.toml.tmpl`, `run_onchange_install-packages.sh.tmpl`) and the new file `encrypted_dot_ticker.yaml.age`. The plaintext `~/.ticker.yaml` lives in the user's home, outside the repo — not staged, not tracked
- [x] 4.2 `git diff --no-color | grep -iE "unit_cost|quantity:|AGE-SECRET"` returns empty: no plaintext position data and no private key material in any staged or unstaged diff
- [x] 4.3 `openspec validate add-ticker` → "Change 'add-ticker' is valid"
- [x] 4.4 chezmoi-apply round-trip validated via direct `age -d -i ~/.config/chezmoi/key.txt encrypted_dot_ticker.yaml.age | diff - ~/.ticker.yaml` → no diff (lossless). chezmoi's internal decryption is a thin wrapper around the same `age` invocation, so the wrapper-level test on main is mechanical confirmation rather than a behavior gate

## 5. Documentation

- [x] 5.1 README "What's Included" now has rows for `ticker` and `age` (CLI Tools); intro paragraph mentions secrets-at-rest via age
- [x] 5.2 README Setup section includes the age bootstrap block — keypair generation, password-manager backup imperative, per-host identity copy, and the irreversible-loss warning; Daily Workflows section includes the `chezmoi re-add --encrypt` flow for editing encrypted files
- [x] 5.3 `docs/manual.html` section 7 (Shell Productivity) extended with two new subsections: "Stocks (TUI)" (tickrs/ticker launch + Tab keybinding + `ticker print`) and "Encrypted files (chezmoi + age)" (re-add --encrypt + age-keygen, plus two flow blocks for editing positions and bootstrapping a new machine)
- [x] 5.4 README and manual stay in sync on the encryption story: README Setup section is the canonical bootstrap (long-form with backup warning); manual cross-references the same commands at the daily-use level (flow block). No content duplication between the two — each plays its role
