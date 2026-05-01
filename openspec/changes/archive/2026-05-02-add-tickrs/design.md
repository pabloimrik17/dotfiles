## Context

The dotfiles install a curated set of CLI tools through a single `run_onchange_install-packages.sh.tmpl` script driven by a `BREW_PACKAGES` array. Every formula in that array currently lives in homebrew-core and is installed with a bare `brew install <pkg>` plus an idempotency check via `command -v <bin>`. There is no existing convention for tapped formulas.

`tickrs` is distributed by the upstream author through a personal tap (`tarkah/tickrs`) — homebrew-core does not carry it. The published install path is:

```
brew tap tarkah/tickrs
brew install tickrs
```

Configuration is a single YAML file. The [tickrs config wiki](https://github.com/tarkah/tickrs/wiki/Config-file) documents `~/.config/tickrs/config.yml`, but that path is Linux-only — on macOS the `tickrs` binary reads from `~/Library/Application Support/tickrs/config.yml` (Rust `dirs` crate convention). Since this dotfiles repo is macOS-primary (the non-macOS branch only prints manual install instructions, it does not run `chezmoi apply` against Linux targets in practice), the chezmoi source mirrors the macOS path directly: `Library/Application Support/tickrs/config.yml`. The user has provided the exact target contents: chart defaults plus a 42-symbol watchlist. There is no host-specific or secret value, so the file is a static chezmoi resource (no `.tmpl`).

The repo already has working precedent for the install-then-config pattern (television, gh-dash, atuin) — this change follows the same shape, with one new wrinkle: introducing tap support.

## Goals / Non-Goals

**Goals:**

- Install `tickrs` as part of the existing brew packages group with the same idempotency, prompt, and skip semantics as every other tool.
- Introduce a small, reusable `BREW_TAPS` convention in the install script so future tapped formulas can be added with one array entry instead of bespoke shell.
- Ship the user-provided `config.yml` (chart defaults + 42 symbols) as a chezmoi-managed file so the watchlist follows the user across machines.
- Surface `tickrs` in the install script's closing summary line and in the non-macOS fallback instructions (Linux: `cargo install tickrs`).

**Non-Goals:**

- Wrapping `tickrs` in shell aliases, keybindings, or a dedicated launcher — the binary is invoked on demand and works fine without any shell glue.
- Templating `config.yml` — values are identical across machines.
- Managing the tickrs cache or symbol auto-completion — tickrs has no cache directory worth versioning.
- Adding any post-install step (no equivalent to `tv update-channels`); tickrs reads `~/.config/tickrs/config.yml` on launch and needs nothing else.
- Refactoring the existing brew install loop beyond the minimum required to support taps.

## Decisions

### Decision 1: Use a `BREW_TAPS` array, tap before the install loop

**Choice**: Add a new array `BREW_TAPS=(tarkah/tickrs)` in `run_onchange_install-packages.sh.tmpl` directly above `BREW_PACKAGES`. Iterate it with `brew tap "$tap"` (idempotent — `brew tap` returns 0 if already tapped) before the BREW_PACKAGES pre-scan. Then add a bare `tickrs` entry to `BREW_PACKAGES` so the existing install loop works unchanged.

**Alternatives considered**:

- _Use the fully qualified name `tarkah/tickrs/tickrs` in `BREW_PACKAGES`_: Works (brew auto-taps when given the full name) but visually inconsistent with the other 22 entries and harder to grep. Also makes `pkg_bin` mapping awkward.
- _Inline `brew tap tarkah/tickrs && brew install tickrs` as a one-off block_: Bypasses the existing prompt/idempotency logic, duplicates the install pattern, and doesn't generalize.

**Rationale**: The `BREW_TAPS` array is one new line plus a 3-line loop. It documents the tap dependency at the top of the file alongside `BREW_PACKAGES` and makes future tapped tools a one-line addition. `brew tap` is idempotent, so running it on every chezmoi apply is safe and cheap.

### Decision 2: Identity mapping for `pkg_bin "tickrs"` (no special case)

**Choice**: Do not add a `tickrs)` arm to the `pkg_bin()` case statement. The default `*) echo "$1"` arm already returns `tickrs` for the binary lookup.

**Rationale**: The package name and binary name match. Adding a redundant arm would just echo the input back — same behavior, more noise.

### Decision 3: Config file is static `Library/Application Support/tickrs/config.yml`, not templated

**Choice**: Create `Library/Application Support/tickrs/config.yml` as a plain YAML file (no `.tmpl` suffix, no chezmoi templating). chezmoi mirrors the source path verbatim, so the file lands at `~/Library/Application Support/tickrs/config.yml` — the path the macOS `tickrs` binary actually reads.

**Alternatives considered**:

- _Source at `dot_config/tickrs/config.yml` + macOS symlink in install script_: Keeps the canonical path XDG-shaped but introduces a symlink dance and an install-script branch to manage it. The repo is macOS-primary; the indirection earns its keep only if Linux deployment via `chezmoi apply` were a real target, which it is not (Linux gets manual install instructions only).
- _Template the symbol list_: There are no per-host or per-user variations of the watchlist.
- _Store symbols in a chezmoi data file_: Over-engineered for a single deployment target.

**Rationale**: The file has no dynamic content and one consumer (the macOS `tickrs` binary). Putting the chezmoi source at the same path the binary reads removes a layer of indirection. Static is simpler to read, simpler to diff, and matches how `dot_config/eza/theme.yml` and similar static configs are handled.

### Decision 4: Non-macOS fallback message points at `cargo install tickrs`

**Choice**: Update the script's non-macOS branch (the `else` block of the `eq .chezmoi.os "darwin"` template) to mention `tickrs` alongside the existing tools, with the install hint `cargo install tickrs`.

**Alternatives considered**:

- _Skip the Linux mention_: tickrs runs on Linux and the user may use this dotfiles repo on Linux later; better to document.
- _Try to install via `cargo` automatically on Linux_: cargo isn't a guaranteed dependency on Linux machines; staying with a printed instruction matches how the rest of the non-macOS branch behaves (it lists tools, doesn't install them).

**Rationale**: Consistency with the other 22 brew packages in the non-macOS instructions. The cargo command is the documented Linux path from the upstream README.

### Decision 5: No post-install step

**Choice**: Do not add anything after the brew packages group runs. The chezmoi apply pass that deploys `~/.config/tickrs/config.yml` is sufficient for tickrs to start with the right defaults next time the user runs `tickrs`.

**Rationale**: tickrs has no equivalent of `tv update-channels`. The CLI flags (chart type, time frame, symbols) are read from the YAML config on launch — no warmup, no cache priming, no theme download. Adding empty plumbing would be wasted code.

## Risks / Trade-offs

- **[Tap unavailability]** If the upstream `tarkah/tickrs` tap goes offline, `brew tap tarkah/tickrs` fails and the brew packages group reports an error for tickrs. → Mitigation: the existing per-package error handling (`error "Failed to install $pkg"`) already covers this — the rest of the brew install loop continues, and the user sees a clear failure. Linux users can fall back to `cargo install tickrs` per the non-macOS instructions.
- **[Yahoo! Finance API drift]** tickrs depends on undocumented Yahoo! Finance endpoints, which can change. → Mitigation: out of scope for this dotfiles repo — that's a tickrs-upstream concern. If the binary stops working, the watchlist file remains valid for the next compatible release.
- **[Symbol list staleness]** The 42-symbol watchlist is hardcoded in the chezmoi-managed config. If the user adjusts the list ad-hoc on one machine via tickrs's UI (the `+`/`-` keybindings), the change is local and gets reverted on the next chezmoi apply. → Mitigation: this is the intended behavior of chezmoi — single source of truth in the repo. Documented implicitly via the static config file; user updates the YAML in the repo when they want the watchlist to evolve.
- **[New `BREW_TAPS` convention]** Introducing a new array adjacent to `BREW_PACKAGES` slightly grows the install script's surface area. → Mitigation: it's three new lines (declaration + loop) and is the cleanest extension point for future tapped tools (the same pattern would otherwise have to be reinvented per-tool).
