## Context

The dotfiles repo installs CLI tools through `run_onchange_install-packages.sh.tmpl` and deploys configs via chezmoi. The archived `add-tickrs` change introduced two reusable conventions: a `BREW_TAPS` array for third-party Homebrew taps, and a chezmoi-managed static YAML for the tickrs watchlist. Both apply directly to `ticker`, but `ticker` has one fundamental difference: its config carries the user's actual stock positions (`lots`: symbol, quantity, unit_cost, fixed_cost). The dotfiles repo is public on GitHub. Committing the file in clear text would expose the user's portfolio — sectors, share counts, cost basis, and total invested capital — which is unacceptable.

No file in this repo is currently encrypted. chezmoi v2.70.2 (already on the user's host) supports `age` natively via the `encryption = "age"` setting and the `encrypted_` filename prefix, but the convention has not been bootstrapped yet: no `[age]` block in `.chezmoi.toml.tmpl`, no `~/.config/chezmoi/key.txt`, no `age` binary in `BREW_PACKAGES`. This change is therefore the first secret in the repo and the moment to establish the encryption convention.

Ticker's binary is distributed via the `achannarasappa/tap` Homebrew tap (not homebrew-core), so installation reuses the `BREW_TAPS` pattern. The config lookup order, verified against the upstream `internal/cli/cli.go`, is `$HOME/.ticker.yaml` first, then `./.ticker.yaml`, then `$XDG_CONFIG_HOME/.ticker.yaml`, then `$XDG_CONFIG_HOME/ticker/.ticker.yaml`. This repo does not export `XDG_CONFIG_HOME`; the macOS adrg/xdg fallback would land in `~/Library/Application Support`, not `~/.config`. The first candidate (`~/.ticker.yaml`) wins regardless and matches the upstream-documented default (`cmd/root.go` flag help: "default is $HOME/.ticker.yaml").

## Goals / Non-Goals

**Goals:**

- Install `ticker` on macOS via the same idempotent brew packages group used for every other tool, reusing the `BREW_TAPS` convention with `achannarasappa/tap` as its second consumer.
- Ship the user's `~/.ticker.yaml` (watchlist, display preferences, `lots` with cost basis, and sector-grouped breakdowns) as a chezmoi-managed file that is encrypted at rest in the repo and decrypted on `chezmoi apply`.
- Establish age as the canonical encryption backend for this repo, with a documented convention reusable for any future secret (config files, tokens, env files).
- Install the `age` binary as part of the brew packages group so `chezmoi apply` can decrypt on every host that runs the install script.
- Document a clear bootstrap flow for new machines: how the user generates the age keypair once, where to store the private key for backup, and how to seed `~/.config/chezmoi/key.txt` on each additional host before the first `chezmoi apply`.

**Non-Goals:**

- Wrapping `ticker` in shell aliases, keybindings, or a dedicated launcher — the binary is invoked on demand.
- Templating the encrypted file (no per-host or per-user variations of the positions).
- Splitting the watchlist out of the encrypted file for sharing (the watchlist itself is also considered sensitive by the user — sector composition is information).
- Sharing the watchlist with `tickrs` (the two tools target different use cases and keep independent lists).
- Adding any post-install step (`ticker` has no equivalent of `tv update-channels`).
- Integrating the age private key with a password manager CLI (1Password, Bitwarden) — the user manages backups manually.
- Encrypting any file beyond `~/.ticker.yaml` in this change. Other future secrets adopt the same pattern but ship in their own proposals.

## Decisions

### Decision 1: age (not gpg) as the encryption backend

**Choice**: Configure `encryption = "age"` in `.chezmoi.toml.tmpl` with a single keypair: a public recipient committed to the template, and a per-host private identity at `~/.config/chezmoi/key.txt` (chmod 600, never committed).

**Alternatives considered**:

- _gpg_: more complex (subkeys, expirations, web of trust, gpg-agent), no existing gpg usage in this repo (commits are not signed), and overkill for one secret with one human owner.
- _age with passphrase (symmetric)_: avoids the per-host private key file, but `chezmoi apply` would prompt for the passphrase on every run, which breaks the "apply is a no-op when nothing changed" UX the rest of the dotfiles repo relies on.
- _Dynamic identity via 1Password / Bitwarden CLI_: chezmoi supports `age.command` to fetch identities at apply time, but the user has no PM CLI configured today, and adding one is a separate concern from "encrypt this one file".

**Rationale**: age is chezmoi-native, ships as a single brew formula (~3 MB), uses Bernstein/Valsorda's modern X25519 + ChaCha20-Poly1305 construction, and the keypair model maps cleanly to "public recipient in the repo, private identity on each machine" — exactly the shape this repo needs.

### Decision 2: Whole-file encryption (Modelo A), not per-block

**Choice**: Encrypt `~/.ticker.yaml` as a single opaque `.age` file at the source root: `encrypted_dot_ticker.yaml.age`. chezmoi decrypts it whole on apply, writes plaintext to `~/.ticker.yaml` (chmod 600). The repo never sees any part of the file in clear text.

**Alternatives considered**:

- _Watchlist plain + lots encrypted via `.chezmoidata/`_: splits the file into a clear template + encrypted data, gives diff-friendly history for the watchlist. **Rejected** because the user considers the watchlist itself sensitive (sector composition leaks portfolio strategy).
- _Encrypt only the `lots` section_: same problem as above, and `ticker` does not support YAML composition / includes — would need a templating layer that doesn't pay for itself.
- _Don't commit the file at all_: rejected because portability (the whole point of chezmoi) requires the file to live in the source tree.

**Rationale**: Whole-file encryption is the simplest model with the strongest privacy guarantee. The cost (no diff readability for watchlist updates) is acceptable because the file changes rarely. When the user updates positions, they edit the plaintext target, then `chezmoi re-add --encrypt` regenerates the .age, then commit — same workflow as any other config file, with one extra flag.

### Decision 3: Private key location is `~/.config/chezmoi/key.txt`, copied manually

**Choice**: The age identity lives at `~/.config/chezmoi/key.txt` on every machine that runs `chezmoi apply`. The user generates the keypair once (`age-keygen -o ~/.config/chezmoi/key.txt`), backs up the private key to their password manager, and copies it manually to each new machine via the manager (paste from clipboard, save with `chmod 600`).

**Alternatives considered**:

- _Store in 1Password / Bitwarden + use `age.command`_: cleaner provenance, no plaintext key on disk. **Rejected for this change** because it adds a dependency and an init flow the user hasn't asked for; the convention is forward-compatible — switching later is a `.chezmoi.toml.tmpl` edit.
- _Bundle the identity in the repo encrypted with a passphrase_: turns the problem into "remember a passphrase" instead of "back up a key file" — strictly worse, since `chezmoi apply` would still need to be interactive on first run.

**Rationale**: A single file on disk (chmod 600) is the simplest model that gives the user full control. The password manager backup is one extra step at key generation time. The trade-off — losing the key without a backup makes the encrypted file unrecoverable — is real, but it's the same trade-off any age user accepts, and it's mitigated by the documented one-time backup step.

### Decision 4: `age` ships in this proposal's `BREW_PACKAGES`, not a separate change

**Choice**: Add `age` to `BREW_PACKAGES` in the same install script edit that adds `ticker`. Without `age` on PATH, `chezmoi apply` cannot decrypt the encrypted file, so the install script's brew packages group must produce both binaries in one pass to keep the "fresh machine → working dotfiles" guarantee intact.

**Alternatives considered**:

- _Split out a prior "add-secrets-encryption" change that ships only the age bootstrap, then layer `ticker` on top_: cleaner OpenSpec dependency graph, but adds a chicken-and-egg moment — that earlier change would have no encrypted file to justify itself, and the user has already approved the bundled scope.
- _Assume the user installs `age` manually_: breaks the install script's idempotency guarantee on a fresh machine and forces a documented manual step into the bootstrap flow.

**Rationale**: The two binaries are required together to make the change work end-to-end. Bundling them keeps the BREW_PACKAGES contract honest (every CLI tool the dotfiles depend on is in that array) and avoids a phantom intermediate change.

### Decision 5: Source path is `encrypted_dot_ticker.yaml.age` at the source root (not under `dot_config/`)

**Choice**: Place the encrypted file at the chezmoi source root using the `encrypted_dot_` filename prefix. chezmoi resolves the source path `encrypted_dot_ticker.yaml.age` → decrypt → target `~/.ticker.yaml`.

**Alternatives considered**:

- _Place under `dot_config/ticker/.ticker.yaml.age` with an absolute target override_: would force the binary to read from `~/.config/ticker/.ticker.yaml`, which is the 4th candidate in the lookup precedence (after $HOME, cwd, $XDG_CONFIG_HOME). Works, but adds chezmoi rules that don't earn their keep when the canonical default at `~/.ticker.yaml` is the 1st candidate.
- _Hide the target as `~/.ticker.yaml.local` and template a wrapper_: invents a new convention for no benefit.

**Rationale**: The upstream-documented default is the path with the highest precedence; the chezmoi source naming maps to it natively (`dot_ticker.yaml` → `~/.ticker.yaml`). Encrypted variant just prepends `encrypted_` and appends `.age`. Nothing else to manage.

### Decision 6: `.chezmoi.toml.tmpl` carries the recipient inline, not a templated prompt

**Choice**: Hardcode the user's public age recipient as a string literal in `.chezmoi.toml.tmpl`. The template still prompts for `name` and `email`, but the age `recipient` is committed in plain text because it is a public key (X25519 public scalar, designed to be public).

**Alternatives considered**:

- _Prompt for recipient on `chezmoi init`_: defeats the purpose — same recipient across machines means we'd be asking the user to paste the same value every time.
- _Store recipient in a chezmoi data file_: more indirection for a single string that doesn't change.

**Rationale**: age recipients are public keys; their entire reason to exist is to live in plain text alongside encrypted payloads. The .chezmoi.toml.tmpl gains a `[age]` block with `identity = "~/.config/chezmoi/key.txt"` and `recipient = "age1..."` — and that's the entire mechanism.

### Decision 7: `chezmoiignore` does not need a Linux/Darwin branch for the encrypted file

**Choice**: Leave `.chezmoiignore.tmpl` unchanged. The encrypted file applies on any OS chezmoi runs on, because `~/.ticker.yaml` is `ticker`'s lookup #1 in all platforms. The Linux branch of the install script will still print manual instructions for `ticker`, but `chezmoi apply` on Linux would deploy `~/.ticker.yaml` correctly if invoked.

**Rationale**: The repo is macOS-primary, but the encrypted-file behavior is OS-agnostic. Adding an ignore rule would make the convention less reusable.

## Risks / Trade-offs

- **[Lockout]** If the user loses the age private key without a backup, the encrypted file in the repo becomes unrecoverable forever. The user must regenerate a keypair, edit the recipient in `.chezmoi.toml.tmpl`, and re-encrypt the file from a remembered plaintext (or rebuild positions from broker records). → Mitigation: the README and manual SHALL document, in a single conspicuous block, the requirement to back up `~/.config/chezmoi/key.txt` to a password manager immediately after `age-keygen`. The bootstrap section is part of this change's documentation deliverable.

- **[Drift between apply and TUI edits]** `ticker`'s in-app keybindings (`+`/`-`) modify positions and persist them back to `~/.ticker.yaml`. If the user edits in-app on machine A and runs `chezmoi apply` on machine B, the change is local to A and lost on B's next apply. → Mitigation: documented workflow — edit the plaintext, `chezmoi re-add --encrypt ~/.ticker.yaml`, commit. This matches the chezmoi single-source-of-truth model used everywhere else in the repo. Documented in the manual.

- **[.chezmoi.toml.tmpl grows]** The template gains a `[age]` block and a `encryption = "age"` setting, ~6 lines. Any future contributor (or future-you) needs to understand age. → Mitigation: a comment in the template pointing to the `chezmoi-encryption` capability spec.

- **[chezmoi version dependency]** age first-class support exists in chezmoi 2.x. The user's host has 2.70.2, but no preflight check exists in the install script. → Mitigation: not added in this change. chezmoi 1.x is several years EOL; the brew formula installs current stable. If a contributor lands on an ancient binary, `chezmoi apply` fails loudly with an actionable error.

- **[Tap unavailability]** If the upstream `achannarasappa/tap` goes offline, `brew tap achannarasappa/tap` fails and the brew packages group reports an error for `ticker`. → Mitigation: the existing per-package error handling (`error "Failed to install $pkg"`) already covers this; the rest of the loop continues, and Linux users fall back to the upstream-recommended manual install.

- **[Yahoo! Finance API drift]** `ticker` depends on undocumented Yahoo endpoints. Out of scope for this dotfiles repo; upstream concern.

- **[Public sector taxonomy]** The `groups` block in `.ticker.yaml` includes Spanish sector names (`Tecnologia`, `Salud`, `Consumo defensivo`, `Consumo ciclico`, `Industriales`, `Servicios de comunicacion`, `Financiero`). These names are not sensitive in themselves, but they live in the same encrypted file as the lots, so they get the same protection automatically.

## Migration Plan

1. **Phase 1 — install age**: The next `chezmoi apply` after this change lands installs `age` via the brew packages group (`age` is the 25th entry of `BREW_PACKAGES`). No user action needed beyond running the install script as usual.

2. **Phase 2 — generate keypair (one-time)**: On the user's primary machine, run `age-keygen -o ~/.config/chezmoi/key.txt` (chmod 600). Copy the public line (starts with `age1...`) into `.chezmoi.toml.tmpl`'s `[age] recipient = "..."` field and commit. **Immediately back up the private key file to a password manager** (the file's contents include both the public and the matching private scalar).

3. **Phase 3 — encrypt the file**: Write the plaintext `~/.ticker.yaml` (the config the user provided in the conversation), then `chezmoi add --encrypt ~/.ticker.yaml`. chezmoi reads the recipient from the template, encrypts in place, and writes `encrypted_dot_ticker.yaml.age` to the source root. Commit the `.age` file.

4. **Phase 4 — bootstrap new machines**: Document in README + manual that any new machine needs the user to (a) place the age private key at `~/.config/chezmoi/key.txt` (chmod 600) from the password manager, then (b) run `chezmoi apply` as normal.

**Rollback strategy**: If anything goes wrong before commit, the encrypted file does not exist yet and the local plaintext can be deleted. After commit, rollback is `git revert` plus deleting `~/.ticker.yaml` from each machine; the `age` binary and the `[age]` block in `.chezmoi.toml.tmpl` are harmless on their own.

## Open Questions

- None blocking. The user's actual config content (display prefs, watchlist, lots, groups) has been provided in conversation and will be encrypted during the implementation phase. Any unit-cost or quantity drift the user wants to record on first encryption can be communicated then; spec-level requirements do not enumerate sensitive values.
