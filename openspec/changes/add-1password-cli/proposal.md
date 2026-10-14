# Proposal

## Why

`op` (1Password CLI) was installed by hand on the Intel host, so other hosts don't get it and the
freeze doesn't cover it. Homebrew ships it as the `1password-cli` cask, and the freeze only pins
formulae and font casks today.

## What Changes

- Install the `1password-cli` cask from the brew packages group (same prompt, same pending count),
  using a new `BREW_CLI_CASKS` array. The cask counts as installed only when brew reports it.
- Freeze it like every other CLI tool: `BREW_VERSIONS` row `1password-cli|2.41.0`, pinned as a
  cask, upgraded with `brew-upgrade-pinned 1password-cli`.
- Print `op` guidance on both branches: turn on the 1Password app integration (Settings →
  Developer → Integrate with 1Password CLI).
- Add `op` to both `CLI tools:` summary lines, with a Linux install hint.
- Document it in `README.md` and `docs/manual.html`.

## Capabilities

### New Capabilities

- `1password-cli-install`: installs `op` from the `1password-cli` cask, frozen at a declared
  version, with app-integration guidance and no managed `op` config.

### Modified Capabilities

- `brew-version-pins`: the freeze also covers CLI casks (`BREW_CLI_CASKS`), not only formulae
  and font casks.

## Impact

- `run_onchange_install-packages.sh.tmpl`: Group 1 install and pre-scan, `apply_brew_freeze`,
  `BREW_VERSIONS`, guidance helper, summary lines.
- `tests/brew-freeze.test.ts`: coverage and fixture include `BREW_CLI_CASKS`;
  `tests/install-script.test.ts` covers the Group 1 cask loop.
- `README.md`, `docs/manual.html`.
