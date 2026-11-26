# Proposal

## Why

Node.js 25 and later no longer ship corepack. With `default` on `lts/*` (now v26.13.1) the NVM group of the
install script fails: `corepack: command not found`, then `Failed to enable corepack`. pnpm came only from
corepack shims, so it vanishes on Node 26 too.

## What Changes

- pnpm is installed with its official standalone installer (`get.pnpm.io`) at a version the script declares,
  into `~/Library/pnpm`, without touching the shell config. pnpm 12 is a native binary for Intel and Apple
  Silicon and needs no Node.js.
- Each project's pnpm version still comes from its `packageManager` field, which pnpm honours by default.
- The shell adds `$PNPM_HOME/bin`, where pnpm 12 links itself, to `PATH`.
- The NVM group drops corepack: no pre-scan check, no `corepack enable`. It reports `2/2` (NVM, Node).
- yarn is no longer provided. No project on this setup uses it.
- A retirement step removes the corepack shims (`pnpm`, `pnpx`, `yarn`, `yarnpkg`) from every nvm Node
  version, only once the standalone pnpm is installed and only links that point into corepack. Otherwise an
  active Node ≤24 would put its shim ahead of the standalone pnpm on `PATH`.
- `default` keeps tracking `lts/*`.

## Capabilities

### New Capabilities

- `pnpm-install`: pnpm from its official standalone installer, its `PATH` entry, idempotency and non-macOS
  guidance.

### Modified Capabilities

- `node-env-bootstrap`: corepack leaves the NVM group; corepack shims are retired once the standalone pnpm
  exists.
- `omz-plugins`: the "manual configuration is preserved" scenario no longer freezes pnpm's `PATH` lines,
  which `pnpm-install` now owns.

## Impact

- `run_onchange_install-packages.sh.tmpl`: Group 6, a new pnpm group, the retirement step, non-macOS
  instructions.
- `dot_zshrc.tmpl`: the pnpm block.
- `tests/install-script.test.ts`: NVM group, pnpm group, shim retirement.
- Docs: README and `docs/manual.html` where they describe Node/pnpm setup.
- Not chosen: Homebrew's `pnpm` ships no Intel macOS bottle, so the Intel host would build it from source and
  keep brew's `node` in `/usr/local/bin`.
