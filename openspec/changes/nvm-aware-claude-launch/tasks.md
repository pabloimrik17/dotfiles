## 1. Shim script (`claude-node-launch`)

- [x] 1.1 Add the shim as a chezmoi `executable_` source at a dedicated shims dir that does not collide with `~/.local/bin/claude` (e.g. `dot_local/bin/shims/executable_claude` → `~/.local/bin/shims/claude`)
- [x] 1.2 Implement the no-`.nvmrc` fast path: builtin walk-up (`${d%/*}`, no `dirname` forks); if nothing found above and below, `exec "$HOME/.local/bin/claude" "$@"` unchanged
- [x] 1.3 Implement the up-then-down `.nvmrc` finder: walk up to filesystem root; if none, bounded walk-down skipping `node_modules/` and `.git/`; on >1 match pick shallowest and warn to stderr
- [x] 1.4 Implement PATH-prepend activation for installed versions: exact pin (`24.12.0`/`v24.12.0`) and major-prefix (`24` → highest matching `$NVM_DIR/versions/node/v24*`), prepend `…/bin` to `$PATH`, no `nvm.sh` sourcing
- [x] 1.5 Implement the cold/alias fallback: when the resolved version is not installed, or `.nvmrc` is an alias (`lts/*`, `node`, `stable`), source `nvm.sh` + `nvm install`/`nvm use`, then delegate
- [x] 1.6 Delegate via `exec "$HOME/.local/bin/claude" "$@"` by absolute path (no recursion); confirm exit status passes through

## 2. PATH wiring

- [ ] 2.1 In `dot_zshrc.tmpl`, prepend the shims dir to `$PATH` ahead of `~/.local/bin` (document why ordering matters; no-op if bypassed)
- [ ] 2.2 `chezmoi apply` and confirm `command -v claude` resolves the shim, not `~/.local/bin/claude` — _deferred to post-merge (user choice). Static check done: `chezmoi diff/managed --source <worktree>` confirms the shim installs at `.local/bin/shims/claude` and the PATH line lands ahead of `.local/bin`. Live `command -v` confirmation pending the normal `chezmoi update`→`apply` after merge._

## 3. AoE integration

- [x] 3.1 Verify whether AoE supports an agent-command override for the `claude` tool (inspect `aoe agents` / config schema, mirror the `[tools.lazygit].command` precedent) — AoE 1.9.5 exposes `aoe add --cmd-override <CMD>` and `--tool <named-custom-agent>` (CLI-level override). More importantly `[sandbox].enabled_by_default = false`: by default claude runs outside the sandbox and inherits the launch shell's PATH, so the shim is hit with no override needed; `NVM_DIR` passthrough is the baseline for when the sandbox is enabled.
- [x] 3.2 Add `NVM_DIR` to AoE `[sandbox].environment` in the chezmoi-managed AoE config (`private_dot_agent-of-empires/…`)
- [ ] 3.3 Confirm the shim resolves the version inside AoE's sandbox (i.e. `~/.nvm` is readable there); if filesystem-isolated, document the limitation — _deferred to post-merge. Note: `[sandbox].enabled_by_default = false`, so by default claude runs outside the sandbox and inherits the launch shell's PATH (shim works with no passthrough). The `NVM_DIR` passthrough (3.2) is the baseline for when the sandbox is enabled; live sandbox-on confirmation pending._

## 4. Verification

> Verification §4 deferred to post-merge (user choice). All cases below were proven against a sandboxed test harness (fake `$HOME`/`$NVM_DIR`/real-claude stub, 15 scenarios); what remains is confirming the same behavior in a live, shim-launched claude after `chezmoi apply`.

- [ ] 4.1 Pinned-version worktree: launch claude via `wsc`/`wt switch -x claude` in a worktree whose `.nvmrc` pins a non-default version; confirm a subprocess `node --version` reports the pinned version — _harness: exact/bare/major/minor pins + walk-up all activate the right `bin/`. Live launch pending._
- [ ] 4.2 Subdir case: worktree with `.nvmrc` only in `apps/web/`; confirm the downward search selects it — _harness: walk-down selects the single subdir `.nvmrc`; multiple → shallowest + stderr warn. Live launch pending._
- [ ] 4.3 Non-Node dir: confirm passthrough with no `$PATH` change and negligible overhead — _harness: no/empty `.nvmrc` and `node_modules`-only matches → passthrough, PATH untouched. Live launch + timing pending._
- [ ] 4.4 Cold install: a pinned version not yet installed triggers the one-time `nvm install` fallback, then steady-state fast path — _harness (fake nvm): uninstalled pin → `nvm use`→`nvm install`; installed pin never sources nvm.sh. Live `nvm install` pending._
- [ ] 4.5 Re-run the prelude benchmark on the final shim to confirm steady-state overhead stays in the single-digit-ms range — _deferred: needs live timing on real hardware after apply._

## 5. Docs

- [x] 5.1 Update `docs/manual.html` (via the manual skill) to document the shim, PATH ordering, and the AoE `NVM_DIR` passthrough
