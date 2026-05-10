## Why

Linear ticket [DOT-13](https://linear.app/monolab/issue/DOT-13/anadir-ticker-terminal-stock-tracker) tracks adopting [achannarasappa/ticker](https://github.com/achannarasappa/ticker) — a Go-based terminal stock tracker — so the user can monitor a private watchlist with cost-basis positions (real-time P/L) directly from the shell. ticker is complementary to the already-shipped `tickrs` TUI: `tickrs` renders full-screen charts on a public watchlist, while `ticker` displays a compact table with private lots — sectors, share counts, and unit costs that must never appear in this public dotfiles repository in clear text. Shipping a chezmoi-managed `~/.ticker.yaml` therefore requires introducing **age-based file encryption** to the repo, which is a new capability (no other secrets are managed today).

## What Changes

- Install the `ticker` binary on macOS by tapping `achannarasappa/tap` (added to the existing `BREW_TAPS` array first introduced by `tickrs`) and adding `ticker` to `BREW_PACKAGES` in `run_onchange_install-packages.sh.tmpl`.
- Install the `age` binary (added to `BREW_PACKAGES`) so `chezmoi apply` can decrypt encrypted files on the host.
- Introduce **age encryption** as a chezmoi convention for this repo:
    - Configure `encryption = "age"` in `.chezmoi.toml.tmpl` with the user's public `recipient` committed and the private `identity` pointing at `~/.config/chezmoi/key.txt` (per-machine, never committed).
    - Document the bootstrap flow (generate key once, copy the private key file to every new machine before `chezmoi apply`).
- Add a chezmoi-managed encrypted file `encrypted_dot_ticker.yaml.age` that deploys to `~/.ticker.yaml` — the path the `ticker` binary reads with the highest precedence (verified against `cmd/root.go` and `internal/cli/cli.go` upstream). The decrypted file contains display preferences (`show-summary`, `show-positions`, `show-fundamentals`, `show-tags`, `show-separator`, `sort: value`, `interval: 15`), a watchlist, `lots` with cost-basis positions, and a sector-grouped breakdown (`groups`) that splits the same lots across named buckets like `Tecnologia`, `Salud`, `Consumo defensivo`, etc.
- Update the install script's closing summary `info` line and non-macOS fallback instructions to mention `ticker` (with the upstream-recommended Linux path).
- Update `README.md` and `docs/manual.html` via the `update-readme` and `update-manual` skills so the new tool and encryption convention are documented.

## Capabilities

### New Capabilities

- `ticker-install`: brew installation of the `ticker` binary via the `achannarasappa/tap` Homebrew tap, integrated into the install script's brew packages group with idempotency, plus a non-macOS fallback message pointing at the upstream-recommended install path.
- `ticker-config`: chezmoi-managed `~/.ticker.yaml` (encrypted in the repo, decrypted on apply) providing the user's watchlist, display preferences, and cost-basis positions.
- `chezmoi-encryption`: age-based encryption convention for this repo — recipient committed in `.chezmoi.toml.tmpl`, identity stored locally and per-machine at `~/.config/chezmoi/key.txt`, with a documented one-time bootstrap to copy the identity to new machines from the user's password manager or external medium.

### Modified Capabilities

- `cli-tool-expansion`: extend the `BREW_PACKAGES` contract from 23 → 25 entries to include `ticker` and `age`, and extend the `BREW_TAPS` array (introduced for `tickrs`) to include `achannarasappa/tap` — confirming the tap convention as a reusable pattern with a second consumer.

## Impact

- Files modified: `run_onchange_install-packages.sh.tmpl` (BREW_TAPS, BREW_PACKAGES, summary `info` line, non-macOS branch), `.chezmoi.toml.tmpl` (age `encryption`, `identity`, `recipient` block), `README.md` and `docs/manual.html` (handled via the `update-readme` and `update-manual` skills).
- Files created: `encrypted_dot_ticker.yaml.age` at the source-tree root (chezmoi deploys it to `~/.ticker.yaml`).
- New external dependencies: the `achannarasappa/tap` Homebrew tap; the `age` encryption tool (Homebrew formula, BSD-licensed).
- New per-machine setup requirement: each host that runs `chezmoi apply` must have `~/.config/chezmoi/key.txt` populated with the user's age private key before the first apply, or the encrypted file fails to decrypt. The README documents how to copy the key from the user's password manager.
- No changes to keybindings, hooks, shell init, or other CLI tools — `ticker` is launched on demand (bare `ticker` command) and reads `~/.ticker.yaml` automatically.
- Risk: losing the age private key without a backup makes the encrypted file in the repo unrecoverable. Mitigation is documented (password manager backup on first key generation).
