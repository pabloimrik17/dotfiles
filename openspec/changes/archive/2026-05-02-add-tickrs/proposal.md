## Why

Linear ticket [DOT-16](https://linear.app/monolab/issue/DOT-16/add-tickrs) tracks adopting [tickrs](https://github.com/tarkah/tickrs) — a Rust TUI that streams real-time Yahoo! Finance data — so the user can monitor a curated US-equity watchlist directly from the terminal without leaving the shell. Shipping tickrs alongside a chezmoi-managed `config.yml` (chart defaults plus the symbol list) makes the watchlist reproducible across machines and keeps the tool consistent with how every other CLI in this dotfiles repo is configured.

## What Changes

- Install the `tickrs` binary on macOS via the upstream `tarkah/tickrs` Homebrew tap, integrated into the existing brew packages group in `run_onchange_install-packages.sh.tmpl`.
- Introduce tap support to the install script so the BREW_PACKAGES loop can install formulas that live outside homebrew-core (`tickrs` is the first such case; pattern is reusable for future tapped tools).
- Add a chezmoi-managed `Library/Application Support/tickrs/config.yml` deployed to `~/Library/Application Support/tickrs/config.yml` (the path macOS `tickrs` reads, per Rust `dirs` crate), containing:
    - `chart_type: candle`, `time_frame: 1M`, `update_interval: 30`, `enable_pre_post: true`, `show_volumes: true`
    - A 42-symbol curated watchlist: `ACM, ADBE, ADSK, AVTR, BAH, BMI, BRBR, BSX, CMG, COO, CPNG, CPRT, CRM, CRTO, DOCS, DPZ, DT, DUOL, FISV, HLI, HLNE, HRL, IPAR, JJSF, LULU, MORN, MSFT, NKE, NOMD, ODD, PAYX, PCTY, PINS, PLNT, POOL, QLYS, RACE, RMD, SMCI, SMPL, VEEV, VITL`.
- Update the install script's closing summary line and non-macOS fallback instructions to mention `tickrs` (cargo path `cargo install tickrs` for Linux users).
- Update `README.md` "What's Included" via the existing `update-readme` skill so the new tool is surfaced in the project README.

## Capabilities

### New Capabilities

- `tickrs-install`: brew installation of the `tickrs` binary via the `tarkah/tickrs` tap, integrated as part of the install script's brew packages group with idempotency and a non-macOS fallback message pointing at `cargo install tickrs`.
- `tickrs-config`: chezmoi-managed `~/.config/tickrs/config.yml` providing chart defaults (`candle`, `1M`, 30s refresh, pre/post hours, volume bars) and the curated 42-symbol watchlist.

### Modified Capabilities

- `cli-tool-expansion`: extend the BREW_PACKAGES contract from 22 → 23 entries to include `tickrs`, document the new `BREW_TAPS` convention used to register `tarkah/tickrs` before the install loop, and confirm `pkg_bin "tickrs"` falls through to the identity mapping (binary name is `tickrs`).

## Impact

- Files modified: `run_onchange_install-packages.sh.tmpl` (BREW_TAPS section, BREW_PACKAGES array, summary `info` line, non-macOS branch), `README.md` (handled via update-readme skill).
- Files created: `Library/Application Support/tickrs/config.yml` (chezmoi static, no template — no host-specific values; chezmoi mirrors the source path verbatim into `$HOME` on macOS).
- New external dependency: the `tarkah/tickrs` Homebrew tap; no other tooling required (`tickrs` runs on both macOS and Linux, fetches data from Yahoo! Finance over HTTPS at runtime).
- No changes to keybindings, hooks, shell init, or other CLI tools — tickrs is launched on demand (`tickrs`) and reads `~/.config/tickrs/config.yml` automatically.
