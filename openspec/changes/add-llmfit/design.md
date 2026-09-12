## Context

See proposal.md — Why. The design question is not *whether* to install llmfit but *through which channel*, because the obvious one is wrong on this host.

Facts the design has to work with:

- **The brew group.** `run_onchange_install-packages.sh.tmpl` installs CLI tools through one group: `BREW_TAPS` is tapped in a loop, then a pre-scan counts how many entries of `BREW_PACKAGES` are missing (`command -v "$(pkg_bin "$pkg")"`), then a single `confirm` prompt gates the install loop. Failures call `error` (increments a counter, never exits). Everything is inside `{{ if eq .chezmoi.os "darwin" }}`; the `{{ else -}}` branch only prints manual instructions.
- **`homebrew/core`.** `llmfit` 1.1.14 declares `rust` as a build dependency and publishes bottles for `arm64_sequoia`, `arm64_sonoma`, `arm64_tahoe`, `arm64_linux`, `x86_64_linux`. There is no `x86_64` macOS bottle.
- **The host.** macOS 15.7.9, `x86_64`, brew prefix `/usr/local`. `llmfit` 1.1.11 is already installed from core and linked; `brew info` shows `1.1.11 → 1.1.14` pending, which on this arch means a Rust source build.
- **The tap.** `AlexsJones/homebrew-llmfit`'s formula pins version 1.1.14 with four `sha256`-pinned release tarballs (macOS/Linux × arm64/x86_64) and a body of `bin.install "llmfit"`. No `depends_on`.
- **The tool.** No config file. Optional `custom_models.json` under `~/Library/Application Support/llmfit/` (or `LLMFIT_CUSTOM_MODELS`). Reads `OLLAMA_CONTEXT_LENGTH` when `--max-context` is absent. Writes its own state (`filters.json`, catalog cache) into the same directory.

## Goals / Non-Goals

**Goals:**

- One install channel that yields a prebuilt binary on every host the dotfiles target, macOS and Linux, Intel and ARM.
- Zero new moving parts: reuse the brew group's pre-scan, prompt, skip check and non-fatal error path rather than adding a dedicated group.
- Leave an already-installed llmfit untouched, whatever its provenance.

**Non-Goals:**

- Version pinning or update automation of any kind — brew owns the version.
- Detecting *which* formula provided an existing `llmfit`, or acting on that.
- Any wiring between llmfit and the Ollama cask the repo installs (no aliases, no wrapper, no hand-off script).

## Decisions

### D1: Install from `AlexsJones/llmfit`, not `homebrew/core`

The core formula would compile llmfit from source on this host at install time and again at every `brew upgrade`, pulling the Rust toolchain to do it, because no `x86_64` macOS bottle is published. The tap formula unpacks a pinned release tarball and installs one binary. Upstream documents the tap as the recommended path for exactly this reason ("works on all macOS/Linux versions"), and keeps the core formula as the build-from-source option.

Alternatives considered:

- **`homebrew/core` (bare `llmfit`)** — one fewer tap, Homebrew-built binary, and on Apple Silicon a bottle already exists. Rejected: on the host these dotfiles actually run, it is a multi-minute Rust build on every version bump, and the `brew upgrade` step is unattended.
- **Quick install script (`curl -fsSL https://llmfit.axjns.dev/install.sh | sh`)** — upstream's zero-dependency path. Rejected: it drops an unmanaged binary into `/usr/local/bin`, colliding with the brew prefix on this host, and the repo has no update path for binaries brew does not own except `update-extra`, which this change explicitly declines to extend (D5).
- **`uv tool install -U llmfit`** — `uv` is already installed and this needs no tap. Rejected as the primary channel: it routes a Rust binary through a Python tool manager into `~/.local/bin`, splitting CLI ownership across two managers for one tool. Kept as the documented brew-free fallback in the non-macOS branch.
- **`cargo install` / `ghcr.io/alexsjones/llmfit`** — rejected: the first needs a Rust toolchain the repo does not install; the second is a container for CI use, not an interactive TUI on a laptop.

### D2: Fully-qualified `AlexsJones/llmfit/llmfit` in `BREW_PACKAGES`, plus a dedicated `pkg_bin` arm

`brew install llmfit` resolves to `homebrew/core` even when the tap is registered, so tapping alone does not select the tap formula — the array entry has to carry the tap prefix. That makes it the first entry in `BREW_PACKAGES` whose name is not also its binary name for a reason unrelated to renaming, so it needs a `pkg_bin` arm returning `llmfit`. Without the arm the pre-scan would probe for a binary named `AlexsJones/llmfit/llmfit`, always fail, and the install loop would re-run `brew install` on every apply — the same failure mode `ripgrep`/`git-delta`/`television` already guard against.

Alternative: keep the bare name and rely on tap precedence. Rejected — precedence runs the other way. Alternative: a dedicated install group (the shape `fallow` and `opencode` use). Rejected — those exist because of ordering constraints and self-updating installers; llmfit has neither.

Implementation surfaced a second, independent reason the qualified name is required (see D7).

### D7: Homebrew 6's trust gate — accept the failing tap, rely on the qualified install

Verified on the host at Homebrew 6.0.22: formulae from non-official taps are refused unless the tap or formula is in `brew trust`'s store (`~/.homebrew/trust.json`), which is empty here. Two consequences, pulling in opposite directions:

- `brew tap AlexsJones/llmfit` on an untapped host **fails**. It clones, the post-tap audit cannot load the formula for any bottle platform, and brew reports `Error: Cannot tap alexsjones/llmfit: invalid syntax in tap!` before rolling the clone back. The message is misleading — the formula is valid Ruby (`ruby -c` passes) and matches what this design describes; "invalid syntax" is how the audit surfaces the trust refusal.
- `brew install AlexsJones/llmfit/llmfit` **succeeds** and registers the tap on the way. A fully-qualified reference is exempt from the gate; a bare name resolving into a third-party tap is not.

So on a fresh host the script's first run prints one non-fatal `Failed to tap AlexsJones/llmfit`, then installs llmfit correctly; every later run taps silently. That is the behaviour the tap loop's `error` path was built for, so nothing else changes.

Rejected: adding `brew trust AlexsJones/llmfit` to the tap loop. It would trade one cosmetic error line for a script that silently grants a third-party tap the right to run arbitrary Ruby on every host these dotfiles provision — a security decision that belongs to the user, not to an unattended `chezmoi apply`.

Out of scope but worth recording: the gate already breaks the repo's two older tap entries, which are listed bare. `brew install tickrs` and `brew install ticker` are both refused on this host today. Their installed binaries keep working, so nothing is broken in practice, but a fresh provision would fail. Fixing that means qualifying both names and giving each a `pkg_bin` arm — the same shape this change introduces for llmfit — and belongs in its own change.

### D3: Never migrate an existing install automatically

The group's skip check is `command -v llmfit`, so on this host — where core's 1.1.11 is linked — the tap formula is simply never installed, and no conflict occurs. Making the script *fix* that would mean uninstalling and reinstalling a working binary during an unattended apply, which breaks the group's "install only what is missing" contract, and would be wrong on Apple Silicon hosts where the core bottle is perfectly good. The switch is therefore a printed manual step: `brew uninstall llmfit && brew install AlexsJones/llmfit/llmfit`.

Alternative: detect the providing tap (`brew info --json` → `tap`) and prompt. Rejected: a per-package interactive branch inside a loop that currently has exactly one prompt, for a one-time action on one host.

### D4: No chezmoi-managed configuration

There is nothing for this repo to manage. Hardware detection is automatic, and llmfit's only file input — `custom_models.json` — is a personal catalog of models the user has, which does not belong in a dotfiles repo that provisions machines generically. `OLLAMA_CONTEXT_LENGTH`, which llmfit reads when `--max-context` is absent, is deliberately not exported either: it changes llmfit's memory estimates *and* Ollama's runtime behaviour, and setting it globally to please one tool would silently reshape the other.

### D5: No automatic invocation, and no `update-extra` step

llmfit's read-only subcommands are cheap, but the same binary also downloads GGUF weights, starts inference servers and runs benchmarks. Rather than enumerate which invocations are safe, no invocation is wired at all — matching how `mole` is treated for the same class of reason. `update-extra` is not extended: its remit is tools brew does not own, and `llmfit update` refreshes a model catalog from HuggingFace, which is a user's editorial decision, not machine maintenance.

### D6: Documentation carries the migration and the usage entry point

Two audiences, two places. The install script's "Manual Installation Required" section carries the one-time core→tap switch, because that is where the script already tells the user what it deliberately did not do. `README.md` gets a `**CLI Tools**` row and `docs/manual.html` the usage entry, generated through the existing `update-readme` / `update-manual` skills so the surrounding tables stay consistent. The manual entry leads with the bare `llmfit` TUI and names `fit` / `recommend --json` as the scriptable surface, since the TUI-by-default behaviour is the thing a first-time user gets wrong.

## Risks / Trade-offs

- **Third-party tap replaces a Homebrew-built formula** → the binary is upstream's, not Homebrew's. Mitigated by `sha256`-pinned tarballs from the project's own GitHub releases, an MIT licence, and this being upstream's recommended channel. The repo already accepts the same exposure for `tickrs` and `ticker`.
- **The tap formula is hand-bumped by upstream** → it can lag `homebrew/core`, which is bot-bumped. Mitigated: nothing in the repo pins a version, so switching back is a one-line edit, and the core formula stays a documented escape hatch.
- **On Apple Silicon the tap buys nothing** → a core bottle already exists there, so the tap is an extra dependency for equal outcome. Accepted deliberately: one channel across all hosts is worth more than per-arch branching in a template that already carries plenty.
- **The skip check hides the channel** → any host with *some* `llmfit` on PATH keeps it, so a fleet can end up mixing core and tap installs, and `brew upgrade` will source-build on the ones still on core. Mitigated only by the printed manual step; accepted as the cost of never touching an existing binary.
- **`exactly 29 entries` is verified by reading the array** → the repo has no test harness for the install script, so the count in `cli-tool-expansion` can drift silently. Mitigated by making the count check an explicit implementation task rather than an assumption.
- **A future `llmfit` in another tap or a rename upstream** → the qualified name would break. Accepted: it fails loudly at `brew install`, inside a non-fatal error path.

## Migration Plan

1. Add the tap entry, the qualified package entry and the `pkg_bin` arm in one edit to `run_onchange_install-packages.sh.tmpl`; add the summary token, the manual-migration line and the non-macOS entry.
2. Verify by re-running the script's brew group on this host: it must report llmfit as already installed and perform no install, uninstall, unlink or relink. The tap loop runs on every pass, so the `brew tap` calls it makes are expected; verify those separately.
3. Verify the fresh-install path without mutating the host: `brew info AlexsJones/llmfit/llmfit` resolves the tap formula, and `pkg_bin` returns `llmfit` for the qualified name.
4. Optional, user-run, out of band: `brew uninstall llmfit && brew install AlexsJones/llmfit/llmfit`.

Rollback is a revert of the single script edit plus `brew untap AlexsJones/llmfit`; any binary already installed keeps working, since nothing depends on it.

## Open Questions

- If the tap formula starts lagging upstream releases materially, is the right response to switch back to `homebrew/core` and absorb the source build, or to move llmfit to `uv tool install` under `update-extra`? Answerable later from observed lag; it changes neither the specs nor the task breakdown today.
