# Design

## Context

See proposal.md for why. Facts that shape the approach:

- Node v26.13.1's `bin` holds only `node`, `npm`, `npx`. Older nvm versions keep `corepack`. On this Mac, v24.18.0
  also has the enabled shims `pnpm`, `pnpx`, `yarn` and `yarnpkg`, each a link to `../lib/node_modules/corepack/dist/*.js`.
- The omz nvm plugin's autoload runs `nvm use` per `.nvmrc`, which puts that version's `bin` first on `PATH`.
  Projects here pin Node 20.12.2, 24.12.0 and 26.13.1, and pnpm 9.0.6, 10.27.0 and 12.21.0.
- pnpm 11+ honours `packageManager` through `pmOnFail` (default `download`).
- Homebrew's `pnpm` has no `x86_64` macOS bottle, and this Mac is the Intel reference host.
- The official installer publishes pnpm 12 as a native `darwin-x64` and `darwin-arm64` binary. It verifies the
  npm registry signature and sha512, then links pnpm into `$PNPM_HOME/bin`.
- `dot_zshrc.tmpl` already exports `PNPM_HOME=~/Library/pnpm` but adds only `$PNPM_HOME` to `PATH`.
- `run_onchange_install-packages.sh.tmpl` re-runs only when its rendered content changes.

## Goals / Non-Goals

**Goals:**

- One pnpm on each Mac, whichever Node version is active.
- The install script converges in a single run: pnpm installed, then shims retired.

**Non-Goals:**

- yarn, under any installer.
- Moving global npm installs (fallow) off Node-version-bound locations.
- The zshrc Node pre-seed mismatch (agentic-task-vmlp).
- Warning when the installed pnpm drifts from the declared version.

## Decisions

### D1: pnpm from the official standalone installer

The script downloads `https://get.pnpm.io/install.sh` to a temp file, then runs it with `PNPM_VERSION=<declared>`,
`PNPM_HOME=$HOME/Library/pnpm` and `PNPM_NO_MODIFY_PATH=1`. Downloading first follows the plannotator group and
pnpm's CI guide: a truncated download never runs. The declared version sits next to the group, like the pinned nvm
installer (`v0.40.4`).

Alternatives:

- Homebrew `pnpm` in the brew freeze: rejected because there is no Intel bottle. The Intel host would build from
  source on every upgrade and keep brew's `node`, `rust` and `esbuild`. Brew's `node` in `/usr/local/bin` shadows nvm
  in non-interactive shells.
- Brew on arm64 and the script on Intel: two update paths for one tool.
- `npm install -g corepack` or `npm install -g pnpm`: bound to one Node version, so the next `nvm install` loses it
  again. corepack is also no longer distributed by Node.js.
- Homebrew `corepack`: depends on brew's `node`.

### D2: Detect the install by path

The pre-scan checks `[ -x "$PNPM_HOME/bin/pnpm" ]`. `command -v pnpm` would accept a corepack shim, the same trap the
brew group avoids for git with `brew list git`. When pnpm is present the group logs `pnpm --version` and does not
prompt.

### D3: Retire shims in the script, not in `.chezmoiremove`

After the pnpm group, a step that is never prompted walks `$NVM_DIR/versions/node/*/bin/{pnpm,pnpx,yarn,yarnpkg}`. It
removes an entry only if it is a symlink whose target contains `corepack/dist/`, and only when
`$PNPM_HOME/bin/pnpm` is executable. This follows the repo's retirement rule ("uninstalled only once its
replacement is installed").

`.chezmoiremove` was tested and rejected. A glob with a `stat` guard works, but once chezmoi has removed a path, a
later `corepack enable` re-creates it. The next apply then stops with "has changed since chezmoi last wrote it" and
exits 1 without a TTY, which blocks every later entry. That is the glow failure mode the `xdg-config-shadowing` spec
warns about. It also needs a second apply, because templates are evaluated before scripts run.

### D4: Order inside the script

The order is Group 6 (NVM + Node), then the new pnpm group, then the shim retirement, then Group 6.5 (fallow). The
pnpm group does not depend on Node, but it sits beside it so all of the Node toolchain reads in one place.

### D5: PATH

The pnpm block in `dot_zshrc.tmpl` adds `$PNPM_HOME/bin` and `$PNPM_HOME`, each guarded against duplicates, with
`/bin` ending up first. nvm's `nvm use` still prepends the active Node's `bin`, which is why D3 is needed.

## Risks / Trade-offs

- [A later `corepack enable` brings a shim back] → It stays until the script next changes, which is often
  (brew bumps). `corepack disable` or deleting the link fixes it at once. The manual says so.
- [`pnpm self-update` inside a project only bumps that project's pin] → To update the global pnpm, run it outside
  any project. The script's declared version applies only to fresh installs. The manual says so.
- [The first run in a project with an older pin needs network] → pnpm downloads that version once and caches it.
- [Remaining global shims in `~/Library/pnpm` (fallow, openspec, npm, npx)] → Unchanged. They stay behind
  `$PNPM_HOME/bin` on `PATH`, so an older global already in `bin` wins. On this Mac that is a pnpm 11 `openspec`
  1.13.0 (`bin/openspec`, `global/v11`) that would shadow 2.0.0; task 4.2 deletes it.
- [The installer warns about a shadowing pnpm on the first run] → Expected while shims exist. The retirement
  step in the same run removes them.

## Migration Plan

1. Merge. On each Mac, `chezmoi update` re-runs the install script once.
2. The run installs pnpm, retires the shims and reports NVM/Node `2/2`.
3. Open a new shell: `command -v pnpm` points at `~/Library/pnpm/bin/pnpm`, including in kinkoi under Node 20.

Rollback: revert the merge. Node ≤24 versions keep `corepack`, so `corepack enable` brings the shims back there.
