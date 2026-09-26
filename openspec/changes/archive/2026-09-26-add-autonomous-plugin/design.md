## Context

See `proposal.md`. The `daily-agentic-task-force` marketplace is already managed end to end (see the archived `add-datf-marketplace` change): `CC_MARKETPLACES` registers it, `extraKnownMarketplaces` sets `autoUpdate: true`, and `datf-lab` goes through `CC_PLUGINS` and `enabledPlugins`.

Upstream `autonomous` 1.0.0 facts that shape the approach:

- `/autonomous:run` runs `bun "${CLAUDE_PLUGIN_ROOT}/src/run.ts"` with no installed dependencies. `bun` is on `PATH` here through `BUN_INSTALL` in `dot_zshrc.tmpl`.
- The quota gate shells out to `openusage claude`. If the binary is missing, the gate returns `not-evaluable` (exit 3), not `advance` (`src/quota-gate/openusage.ts`, `step.ts`).
- OpenUsage ships as the `openusage` cask (macOS ≥ 15). The cask installs only `OpenUsage.app`. The app creates `/usr/local/bin/openusage` itself, so installing the cask does not guarantee the CLI.

## Goals / Non-Goals

**Goals:**

- Same install, enable, and update path as `datf-lab`, with no new mechanism.
- Document how the plugin runs and fails without OpenUsage, so a missing prerequisite reads as expected.

**Non-Goals:**

- Installing OpenUsage or exposing its CLI (user decision: plugin only).
- Gating the plugin by architecture or machine type.
- Vendoring or pinning upstream plugin content.

## Decisions

### Reuse `CC_PLUGINS` and `enabledPlugins`

Add one ID to each. This keeps the pre-scan, confirmation, PTY-safe wrapper, and skip-if-installed behavior. A dedicated install group was rejected: the plugin needs no binary, platform gate, or custom installer from this repo.

### No new marketplace entry

`autonomous` comes from the already-registered marketplace, so `CC_MARKETPLACES` and `extraKnownMarketplaces` stay unchanged. Updates follow marketplace-scope `autoUpdate`. An `update-extra` step or version pin was rejected for the same reasons recorded for `datf-lab`.

### Enable on every machine

The plugin is enabled unconditionally, like `datf-lab`. On a machine without OpenUsage, the command fails closed with `not-evaluable`, so enabling it has no side effects. Gating it on `.chezmoi.arch` (as with `superwhisper`) was rejected: the dependency is a user-installed app, not something tied to an architecture, and the template cannot see it.

### OpenUsage is documented, not provisioned

The manual lists `bun` and the `openusage` CLI as requirements, and says OpenUsage is installed manually and its CLI must be on `PATH`. A cask row and a `PATH` entry for `/Applications/OpenUsage.app/Contents/Helpers` were offered and declined.

### Parity: extend the existing row

The Daily Agentic Task Force row gets the second plugin ID in its Claude Code cell. Codex, OpenCode, and Junie stay `none` with the same reason. A second row was rejected: the row is keyed by upstream distribution, and the reason is identical.

### Manual: extend the DATF subsection

Section 11's "Daily Agentic Task Force lab" subsection becomes the DATF subsection. It covers `datf-lab` (provisional) and `autonomous` (`/autonomous:run [--account <provider-key>] [--force] [--json]`, exit codes 0/2/3/1, requirements), plus one updates row for both. `/autonomous:run` does not go in the generic "Slash commands (from plugins)" table: that would repeat it, and it would lose the requirements next to it. No README change, matching the repo's policy for Claude Code plugins.

## Risks / Trade-offs

- **Upstream contracts are provisional** (`autonomous.run.v1`, step contract) → the manual states it and documents only flags, exit codes, and requirements, not report internals.
- **Background refresh can change behavior without a dotfiles commit** → accepted marketplace trade-off, same as `datf-lab`.
- **`/autonomous:run` returns `not-evaluable` on machines without OpenUsage** → expected and fail-closed. The manual names the fix.
- **Manual can drift from upstream** → document only the synopsis, exit codes, and requirements, and link the upstream README for the rest.

## Migration Plan

1. Add the IDs to `CC_PLUGINS`, `enabledPlugins`, and the non-macOS guidance. Update parity and the manual.
2. Apply. On macOS, confirm the Claude Code plugin dependencies group. On non-macOS, run the printed command.
3. Reload Claude Code and run `/autonomous:run`. Expect exit 0/2 with OpenUsage installed, or 3 without it.
4. Rollback: remove the two entries and the guidance line, then reapply. Remove the installed plugin explicitly with `claude plugin uninstall autonomous@daily-agentic-task-force` if wanted.
