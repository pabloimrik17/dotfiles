# Add llmfit (DOT-66)

## Why

This machine already ships the Ollama cask (`ALL_CASKS`: `ollama|Ollama|AI|Local LLM runner`) but nothing that answers the question that comes *before* `ollama pull`: which of the hundreds of published models will actually run here, and how fast. On this host the question is not academic — 16 GB of RAM at ~18 GB/s, a 4 GB Radeon Pro 555X and a 1.5 GB Intel UHD 630 mean most of the catalog does not fit, and the ones that do are bandwidth-bound. Today the only way to find out is to pull the weights and see.

[llmfit](https://github.com/AlexsJones/llmfit) (Rust, MIT, `AlexsJones`) closes that gap from the terminal: it detects RAM/CPU/GPU, scores every model in its catalog across memory fit, estimated tok/s, quality and context, and prints the ones that fit — interactive TUI by default, classic subcommands (`fit`, `recommend`, `info`, `plan`, `diff`, `doctor`, `bench`) for scripts, and `--json` on every subcommand for agent consumption. It reads hardware and a local catalog; the scoring itself needs no network and no account.

## What Changes

**Install channel — the upstream tap, not `homebrew/core`:**

- Add `AlexsJones/llmfit` to `BREW_TAPS` in `run_onchange_install-packages.sh.tmpl` (third entry, after `tarkah/tickrs` and `achannarasappa/tap`).
- Add the fully-qualified `AlexsJones/llmfit/llmfit` to `BREW_PACKAGES`, taking the array from 28 to 29 entries. The qualified name is required: a bare `llmfit` resolves to `homebrew/core` first, which is the formula this change deliberately avoids.
- Add a `pkg_bin` case arm mapping `AlexsJones/llmfit/llmfit` → `llmfit` so the existing `command -v` pre-scan and skip check keep working — the default identity mapping would look for a binary literally named `AlexsJones/llmfit/llmfit`.

The core formula is the wrong channel *for this host*. `llmfit` 1.1.15 in `homebrew/core` (snapshot; brew owns the version, nothing here pins it) publishes bottles for `arm64_sequoia`, `arm64_sonoma`, `arm64_tahoe`, `arm64_linux` and `x86_64_linux` — there is no `x86_64` macOS bottle, and the formula carries `rust` as a build dependency. On this machine (macOS 15.7.9, `x86_64`, brew prefix `/usr/local`) both the initial install and every subsequent `brew upgrade` would therefore compile llmfit from source. The pending 1.1.11 → 1.1.15 upgrade already sitting on this host is exactly that build. The tap formula downloads the prebuilt release tarball for the running OS/arch and does nothing but `bin.install "llmfit"`, which is also what upstream recommends.

**Documented one-time migration, never automated:**

- This host already carries `homebrew/core`'s `llmfit` 1.1.11, linked at `/usr/local/bin/llmfit`. The brew group's `command -v` check will see it and skip, so the tap formula would silently never be installed — and the source-build cost would stay.
- The install script SHALL NOT uninstall, unlink or relink an existing `llmfit`; the switch (`brew uninstall llmfit && brew install AlexsJones/llmfit/llmfit`) belongs in the "Manual Installation Required" section, as a one-time step the user runs deliberately.

**Summary line and non-macOS branch:**

- Add `llmfit` to the closing `CLI tools:` line under the macOS branch (after `mdfried`).
- Add `llmfit` to the non-macOS CLI-tools list, with its own annotated entry. Unlike `mole` and `aoe`, llmfit is genuinely cross-platform: the same tap works on Linux, and `uv tool install -U llmfit` is a fallback that needs no brew (`uv` is already in `BREW_PACKAGES`).

**Nothing else is wired:**

- No chezmoi-managed configuration. llmfit's optional user inputs — a `custom_models.json` under `~/Library/Application Support/llmfit/` (or `LLMFIT_CUSTOM_MODELS`) and `OLLAMA_CONTEXT_LENGTH` — are user-owned and machine-specific, and this change ships none of them.
- No automatic invocation from any script, hook, alias or shell startup file. `download`, `run`, `serve` and `bench` move gigabytes, start servers and saturate the machine; `update` refreshes the catalog from HuggingFace. Every one of those is a user-typed command.
- No `update-extra` step. `update-extra` exists for tools that brew does not own; the binary is brew-managed, and the catalog refresh is a deliberate network action, not maintenance.

## Capabilities

### New Capabilities

- `llmfit-install`: owns the whole surface of the tool in these dotfiles — the tap + fully-qualified package entry, the `pkg_bin` mapping, the idempotency and non-fatal-failure behaviour inherited from the brew group, the documented migration off the core formula, the summary and non-macOS lines, and the explicit exclusions (no managed config, no automatic invocation, no `update-extra` step).

### Modified Capabilities

- `cli-tool-expansion`: four requirements change. *BREW_PACKAGES array includes all actively used CLI tools* — count 28 → 29 and the new entry, which is also the array's first fully-qualified formula name. *pkg_bin function maps all packages to their binary names* — a row joins `ripgrep`/`git-delta`/`television` in the mapping table, the first one that exists because of a tap prefix rather than a different binary name; the same edit corrects a stale table that omitted the `worktrunk` → `wt` and `beads` → `bd` arms the script has always had, and therefore wrongly placed both under the identity mapping (descriptive fix, no behaviour change). *BREW_TAPS array registers third-party Homebrew taps before installs* — the pinned value becomes `(tarkah/tickrs achannarasappa/tap AlexsJones/llmfit)`. *Non-macOS fallback includes all new packages* — the CLI-tools list gains `llmfit` plus its annotation.

## Impact

- **Files** (touched by the implementation, not by this change): `run_onchange_install-packages.sh.tmpl`, `README.md`, `docs/manual.html`.
- **Docs**: a `**CLI Tools**` row for llmfit in the README table (via the `update-readme` skill) and the matching manual entry (via `update-manual`). The manual entry SHALL state that the TUI is the default with no arguments, and SHALL name `fit`/`recommend --json` as the scriptable surface.
- **Dependencies**: one new third-party tap, `AlexsJones/llmfit` (`AlexsJones/homebrew-llmfit`). The tap formula has no build or runtime dependencies — it unpacks a release tarball pinned by `sha256` and installs a single binary. No npm package, no cargo build, no Rust toolchain.
- **Renovate / update-extra**: nothing to add. There is no `pkg@version` in the repo to pin — the tap formula carries the version and `brew upgrade` moves it.
- **Trust surface**: a third-party tap replaces a `homebrew/core` formula, so the binary is upstream's build rather than Homebrew's. Accepted: it is the install path upstream documents as recommended, the alternative is a Rust source build on every upgrade of this host, and the repo already runs two third-party taps for `tickrs` and `ticker`.
- **Homebrew 6 trust gate**: Homebrew now refuses to load formulae from taps absent from `brew trust`'s store, so `brew tap AlexsJones/llmfit` fails on a host that has not tapped it yet. The fully-qualified `brew install AlexsJones/llmfit/llmfit` is exempt and registers the tap itself, so the tap loop's failure is cosmetic and non-fatal (design D7). No `brew trust` step is added — granting a tap arbitrary-Ruby rights is the user's call, not an unattended `chezmoi apply`'s. The same gate already breaks the bare `tickrs` and `ticker` entries on a fresh host; that is pre-existing and left to its own change.
- **Network**: the scoring path (`fit`, `recommend`, `info`, `plan`, `diff`, `system`, `doctor`) is local. `update`, `download`, `hf-search` and the TUI's leaderboard/benchmark-sharing features reach out to HuggingFace and the project's own service — all user-initiated, none configured here.
- **Non-goals**: the sister projects (`llmserve`, `llama-panel`, `sympozium`), the `ghcr.io/alexsjones/llmfit` container image, `llmfit serve` (REST API for cluster scheduling), `llmfit claim` (Kubernetes DRA ResourceClaim), the OpenClaw integration, contributing benchmark results back upstream from the TUI, a shipped `custom_models.json`, and any agent-facing skill or MCP wrapper around `recommend --json`.
