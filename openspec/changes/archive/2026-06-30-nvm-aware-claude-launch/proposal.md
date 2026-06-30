## Why

When a worktree's project pins a strict Node version via `.nvmrc` that differs from the nvm default, `claude` starts under the wrong Node. `claude` itself is a Node-independent native binary, but its child processes (the Bash tool, hooks, `node`/`bun`/`npm`) inherit its `PATH` — so every project command runs under the wrong Node, forcing per-session workarounds. The usual fix (nvm's `chpwd` autoload) never fires: every launcher uses `wt switch -x claude` (or AoE), which is `chdir`+`exec`, not a shell `cd`, so no `chpwd` hook runs. There is no point in the chain that corrects the Node version today.

## What Changes

- Add a launch **shim named `claude`** on `PATH` *ahead* of the real binary (`~/.local/bin/claude`). It selects the project's Node version, then `exec`s the real claude by absolute path. Every existing launcher (`wsc`, `wsh`, gh-dash, AoE) flows through it **unchanged** — no per-launcher edits, nothing new to type.
- Activation by **PATH-prepend** of the resolved version's `bin/` dir. Benchmarked: ~0.4 ms vs **~0.8 s** for `source nvm.sh && nvm use`. The shim does **not** source nvm in steady state.
- `.nvmrc` **finder**: walk *up* from the worktree root (covers root + ancestors); if none found, search *down* (bounded depth, skipping `node_modules`/`.git`) for the single `.nvmrc`. If more than one is found, pick the shallowest and warn on stderr.
- **Cold fallback** (only path that touches nvm): if the pinned version isn't installed yet (strict project, first run) or `.nvmrc` is an alias form (`lts/*`, `node`), fall back to sourcing nvm + `nvm install`/`use`. One-time cost; steady state stays on the fast path.
- **No-`.nvmrc` fast path**: builtin walk-up (no `dirname` forks) → straight `exec`. Benchmarked at +~1.6 ms over the bare-process floor.
- **AoE integration**: ensure AoE launches claude through the shim — via an agent-command override if AoE supports one, else by adding `NVM_DIR` to AoE's `[sandbox].environment` so the shim resolves the version by filesystem inside the sandbox (it needs no nvm *function*, only `$NVM_DIR/versions/node/`). Exact mechanism pending a verification task.

## Capabilities

### New Capabilities
- `claude-node-launch`: a PATH shim that resolves the project's Node version from `.nvmrc` (up-then-down finder) and launches `claude` under it via PATH-prepend, with a cold fallback to nvm install/use; plus the `PATH` ordering that makes the shim intercept every `claude` invocation regardless of launcher.

### Modified Capabilities
- `agent-manager`: AoE must launch `claude` through the shim — either an agent-command override or `NVM_DIR` added to `[sandbox].environment`. **Sequencing**: `agent-manager` is mid-change in `improve-aoe-config` (not yet synced to `openspec/specs/` in final form); this delta depends on that change being archived/synced first, or the two being co-sequenced.

## Impact

- **Code touched**: a new chezmoi-managed shim (e.g. `~/.local/bin/shims/claude` via `executable_` source), `dot_zshrc.tmpl` (prepend the shims dir to `PATH`, ahead of `~/.local/bin`), and possibly AoE config (`private_dot_agent-of-empires/…` `[sandbox].environment`).
- **Launchers unchanged**: `wsc`/`wsh` aliases, `wsh` tmux fn, and gh-dash `-x claude`/`-x 'aoe add …'` keep referencing `claude`.
- **Latency**: +~2–7 ms per claude launch in steady state (imperceptible vs claude's own startup); one-time `nvm install` only when a pinned version is missing.
- **External deps**: none new — reuses the existing nvm install (`node-env-bootstrap`).
- **Non-goals**: (a) reviving the dead OMZ nvm `autoload` (the `~/.oh-my-zsh` clone is from 2018; its 2-line nvm stub ignores the `autoload`/`silent-autoload` zstyles) for manual `cd` — a related but separate defect; folded in only if explicitly chosen. (b) changing how Node/nvm is installed (`node-env-bootstrap`).
