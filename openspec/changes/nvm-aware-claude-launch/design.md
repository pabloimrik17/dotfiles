## Context

Worktrees are launched into `claude` through several entry points — the `wsc` alias and `wsh` tmux fn (`dot_zshrc.tmpl`), gh-dash bindings (`dot_config/gh-dash/config.yml`), and AoE (`aoe add`). All of them ultimately run `wt switch … -x claude` (or AoE launches claude itself). `wt switch --execute` does `chdir()` + `exec()` — it **replaces** the `wt` process with claude; it is not a shell `cd`, so no zsh `chpwd` hook fires. `claude` is a Node-independent native binary at `~/.local/bin/claude`, but its child processes (Bash tool, hooks, `node`/`bun`/`npm`) inherit its `$PATH`. When the active Node is the nvm default but the project pins a different version (`.nvmrc`, often strict), those child commands run under the wrong Node.

Two consequences shape the design: (1) a worktrunk lifecycle hook cannot help — it runs in a subprocess that exits before claude starts; (2) the shell's nvm `autoload` cannot help — `-x` bypasses `chpwd` entirely (and separately, the `~/.oh-my-zsh` clone is from 2018 and its nvm plugin is a 2-line stub that ignores the `autoload` zstyles, so autoload is dead even for manual `cd`). The only point in the chain that runs *in the process that becomes claude* is the launch command itself.

## Goals / Non-Goals

**Goals:**
- claude (and its subprocesses) start under the project's `.nvmrc` Node version, automatically, regardless of launcher.
- Zero change to muscle memory or launcher configs — keep typing `wsc` / `claude`.
- Negligible per-launch latency.

**Non-Goals:**
- Reviving the dead OMZ nvm `autoload` for manual `cd` (related but separate; out unless explicitly folded in).
- Changing how nvm/Node is installed (`node-env-bootstrap`).
- Supporting version signals other than `.nvmrc` (no `.node-version`, no `package.json` `engines.node`).

## Decisions

### D1 — A launch shim, not a worktrunk hook or a chpwd hook
The node selection must happen in the process that becomes claude. A `post-start` hook is a dead subprocess; `chpwd` is bypassed by `exec`. Only wrapping the launch command works. **Alternative rejected:** worktrunk `post-start nvm use` — runs in a throwaway subprocess, never touches claude's env.

### D2 — Activate via PATH-prepend, never source nvm in steady state
Benchmark (60 iters, macOS, single installed version; `exec true` stand-in for the real binary):

| Variant | median | overhead |
|---|--:|--:|
| `/bin/sh` floor | ~11 ms | — |
| finder, no `.nvmrc` (builtin walk) | ~12.5 ms | +1.6 ms |
| PATH-prepend, `.nvmrc` present | ~17.5 ms | +0.4 ms |
| `source nvm.sh` only | ~385 ms | +367 ms |
| `source nvm.sh` + `nvm use` | ~791 ms | +773 ms |

Sourcing `nvm.sh` (4448 lines) costs ~0.8 s per launch — unacceptable on every claude open. Prepending the resolved version's `bin/` to `$PATH` is free. **`source nvm.sh` is therefore confined to the cold fallback only.** **Alternative rejected:** always `source nvm.sh && nvm use` (the "obvious" form) — 0.8 s tax per launch.

### D3 — The shim is named `claude` and shadows the binary on PATH
A real executable `claude` placed on `$PATH` ahead of `~/.local/bin/claude` is intercepted by **every** resolution of the command — typed, `wt -x` (which does a PATH `exec`, not a shell function lookup), and AoE — so no launcher needs editing. It `exec`s `$HOME/.local/bin/claude` by absolute path (the installer-maintained symlink), avoiding recursion. **Alternatives rejected:** (a) a zsh function `claude()` — not seen by `-x`'s PATH `exec` nor by AoE; (b) a separately-named `claude-nvm` wired into each launcher — more surface, a new name to remember, and the manually-typed `claude` case stays broken.

### D4 — Finder: builtin walk-up, then bounded walk-down; `.nvmrc` only
Walk up with shell parameter expansion (`${d%/*}`), not `$(dirname)` per level (the fork form cost +29 ms vs +1.6 ms). Up-walk covers root + ancestors. If nothing above, search down (bounded depth; skip `node_modules/`, `.git/`) for the single `.nvmrc` — the confirmed real case (one `.nvmrc` in a subdir like `apps/web/`). If >1 found, pick shallowest and warn (defensive; not the expected case). **Alternative rejected:** walk-up only — would never find a subdir `.nvmrc`, failing the stated requirement.

### D5 — chezmoi layout and PATH ordering
Ship the shim as a chezmoi `executable_` source so the exec bit is preserved, in a dedicated shims dir (e.g. `~/.local/bin/shims/claude`) that does **not** collide with the installer's `~/.local/bin/claude`. `dot_zshrc.tmpl` prepends that shims dir to `$PATH` ahead of `~/.local/bin` (today `~/.local/bin` is PATH position 14). The shim itself stays POSIX `sh` for fast startup; only the cold-fallback branch needs bash/zsh semantics for `nvm.sh`.

### D6 — AoE via NVM_DIR passthrough
AoE sandboxes the agent with an env allowlist and does not run the user's rc. The shim needs only `NVM_DIR` + filesystem (no `nvm` function), so adding `NVM_DIR` to AoE's `[sandbox].environment` lets the shim resolve inside the sandbox. Whether AoE also exposes an agent-command override (as it does for `[tools.lazygit].command`) is a verification task; the passthrough is the robust baseline either way.

## Risks / Trade-offs

- **[Risk] The shim intercepts every `claude`, including worktrunk's commit-message generation (`claude -p --model=haiku …`).** → The no-`.nvmrc` and prepend paths add single-digit ms; in a pinned repo it harmlessly prepends. Keep the shim cheap; if measured cost ever matters, short-circuit on `-p`.
- **[Risk] PATH ordering regressions** — if the shims dir is not ahead of `~/.local/bin`, the shim is bypassed silently. → Assert ordering in the zshrc block and document it; the shim is a no-op if not first (real claude still runs).
- **[Risk] AoE sandbox filesystem-isolates `~/.nvm`** — then the shim cannot read versions even with `NVM_DIR` set. → Verification task D6; fallback is to accept default Node inside AoE and document the limitation.
- **[Trade-off] Multiple `.nvmrc` below root** is resolved heuristically (shallowest + warn), not configurably. Acceptable for the confirmed single-subdir case.
- **[Trade-off] Alias `.nvmrc` (`lts/*`, `node`) pays the slow path** every launch (can't prepend without resolving the alias). Acceptable — pinned numeric versions are the norm; alias users can pin.

## Migration Plan

1. Add the shim source + the `dot_zshrc.tmpl` PATH prepend; `chezmoi apply`.
2. Verify ordering (`command -v claude` resolves the shim) and a pinned worktree (`node --version` inside a shim-launched claude matches `.nvmrc`).
3. Add `NVM_DIR` to AoE `[sandbox].environment`; verify an AoE session.
- **Rollback:** remove the shim file and the PATH line; `chezmoi apply`. Launchers fall back to the real `claude` with zero residue.

## Open Questions

- Does AoE support an agent-command override for the `claude` tool, or is `NVM_DIR` passthrough the only lever? (verification task)
- Fold the dead-OMZ-`autoload` fix (manual-`cd` auto-switch) into this change, or track it separately?
- Sequencing vs `improve-aoe-config`: both touch `agent-manager`; this change's `agent-manager` delta assumes that change is archived/synced first, or the two are co-sequenced.
