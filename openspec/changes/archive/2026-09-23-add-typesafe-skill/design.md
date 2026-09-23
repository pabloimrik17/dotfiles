## Context

- Claude Code plugins come from `CC_MARKETPLACES`/`CC_PLUGINS` (Group 8) plus the managed keys in `modify_settings.json.tmpl`. Other agents get skills from `install_skill <repo> <name> "<agents>"` (Group 9), which checks each agent against the cached `skills list -g --json`.
- Matt Pocock skills set the precedent: plugin for Claude Code, skills.sh for the rest, never both.
- age is already configured (`.chezmoi.toml.tmpl`, recipient committed). `encrypted_dot_ticker.yaml.age` is the only encrypted file so far. The repo is public.
- zshrc has no way to load secrets. The TypeSafe docs expect the key exported as `TYPESAFE_API_KEY`.

## Goals / Non-Goals

**Goals:**
- One TypeSafe copy per agent, reconciled on every apply.
- A generic secrets file, so later keys (`POSTHOG_API_KEY` was already deferred for lack of one) need no new mechanism.

**Non-Goals:**
- Per-project scoping of the key (direnv `.envrc` stays available per project, and nothing here prevents it).
- Delivering secrets to GUI-launched processes that never run zsh.
- A TypeSafe SDK or CLI install. The skill reads live docs and the SDK belongs to each project.

## Decisions

**D1: Plugin for Claude Code, skills.sh for OpenCode, Junie and Codex.** Upstream says to use one method. The plugin gives Claude Code `/typesafe:typesafe-ai` and auto-update through `extraKnownMarketplaces`. Codex is included because upstream ships no Codex plugin, the same as gluestack. The alternative, skills.sh for all four, was rejected: Claude Code would lose the namespaced command and marketplace auto-update.

**D2: age-encrypted file over Keychain or a manual step.** It reuses infrastructure every machine already needs for ticker, and it adds no manual step per machine.
- Keychain (`security add-generic-password` plus a read in zshrc) keeps the ciphertext out of git. It was rejected because every machine needs a manual step, and zshrc would pay for a `security` subprocess per key on each shell start.
- A manual step printed at the end of setup was rejected because nothing would be reproducible.

**D3: Path `~/.config/zsh/secrets.zsh`, source `dot_config/zsh/encrypted_private_secrets.zsh.age`.** `private_` gives mode 600. The file lives under XDG, next to the rest of the managed config. The file contains only exports, so sourcing it is cheap and has no side effects. zshrc sources it right after the `# User configuration` exports, guarded by `[[ -r ... ]]`.

**D4: The plaintext never reaches the agent transcript.** The user writes the file and encrypts it themselves, running `! chezmoi add --encrypt ~/.config/zsh/secrets.zsh` after creating it, or `chezmoi edit` later. The implementation only wires up the source path, the zshrc line, and the docs.

## Risks / Trade-offs

- [Ciphertext for a live key sits in a public repo] → age X25519 with a private identity per host. If `key.txt` leaks, rotate the TypeSafe key at console.typesafe.ai/keys and re-encrypt.
- [Rotating the key means re-encrypt + commit + `chezmoi update` on every machine] → Accepted: this is the same cost ticker already has.
- [Apply fails on a host without `key.txt`] → ticker already has the same failure mode, and the bootstrap in the README/manual covers it.
- [Every child of the shell inherits the key, agents included] → Intended: the skill's experiment flow runs queries with it.
- [GUI apps started outside zsh don't see the key] → Launch the agent from a terminal. JetBrains IDEs load the login-shell environment, so Junie inside WebStorm still gets it.
- [chezmoi source dir is stale] → Run `chezmoi update` before apply (see the dual-dir layout).

## Migration Plan

Run apply on each machine after merging. Rollback: remove the zshrc line and the `.age` file. The plugin and skill are removed with `claude plugin uninstall typesafe@typesafe-ai` and `npx skills remove typesafe-ai -g`.
