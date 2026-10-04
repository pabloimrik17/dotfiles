## Context

See `proposal.md`. The `daily-agentic-task-force` marketplace is already managed end to end (see the archived `add-datf-marketplace` and `add-autonomous-plugin` changes): `CC_MARKETPLACES` registers it, `extraKnownMarketplaces` sets `autoUpdate: true`, and `datf-lab` and `autonomous` go through `CC_PLUGINS` and `enabledPlugins`.

Upstream `stonks` facts that shape the approach:

- `/stonks:sync` is user-invoked only (`disable-model-invocation: true`). It runs both phases by default; `--only sources` runs the sync phase and `--only watchlist` the watchlist phase.
- At runtime it needs three things this repo provisions elsewhere: the `ibkr` MCP server and the `gws` CLI (`add-stonks-tooling`), and the encrypted `~/.config/stonks/config.json` (`add-plugin-configs`).
- Installing the plugin needs none of them. Only the plugin's presence in the marketplace matters at install time.

## Goals / Non-Goals

**Goals:**

- Same install, enable, and update path as `datf-lab` and `autonomous`, with no new mechanism.
- State the merge ordering so the install does not fail on machines that apply before the plugin is released.

**Non-Goals:**

- The plugin's config file, `gws`, the IBKR MCP server, or its permission deny (sibling changes).
- Gating the plugin by architecture or machine type.
- Vendoring or pinning upstream plugin content.

## Decisions

### Reuse `CC_PLUGINS` and `enabledPlugins`

Add one ID to each. This keeps the pre-scan, confirmation, PTY-safe wrapper, and skip-if-installed behavior. A dedicated install group was rejected: the plugin needs no binary, platform gate, or custom installer from this repo.

### No new marketplace entry

`stonks` comes from the already-registered marketplace, so `CC_MARKETPLACES` and `extraKnownMarketplaces` stay unchanged. Updates follow marketplace-scope `autoUpdate`. An `update-extra` step or version pin was rejected for the same reasons recorded for `datf-lab`.

### Enable on every machine

The plugin is enabled unconditionally, like `datf-lab` and `autonomous`. `/stonks:sync` never runs on its own, so a machine lacking the tooling or config has no side effect from the plugin being enabled. Gating it on machine type was rejected: the template cannot see whether the user's brokerage and sheet access exist.

### Prerequisites are provisioned by sibling changes, not here

The plugin's runtime needs are split across `add-plugin-configs` and `add-stonks-tooling` to keep each change reviewable and each spec owner clear. This change references them in the manual but adds no requirement on them, so it stays mergeable independently of them.

### Merge ordering: after the plugin is released

The install script runs `claude plugin install stonks@daily-agentic-task-force`, which fails while the marketplace does not list `stonks`. So this PR merges only after the upstream plugin PR is merged and its first release is cut. The upstream PR itself merges after both dotfiles siblings, so the practical order is: siblings, then upstream plugin and release, then this change. Nothing in the artifacts can enforce this; it is a merge-time gate recorded in the tasks.

### Parity: extend the existing row

The Daily Agentic Task Force row gets the third plugin ID in its Claude Code cell. Codex, OpenCode, and Junie stay `none` with the same reason. A new row was rejected: the row is keyed by upstream distribution, and the reason is identical.

### Manual: extend the DATF subsection

Section 11's Daily Agentic Task Force subsection gains `stonks`: `/stonks:sync [--only sources|watchlist]`, what it needs at runtime (the `ibkr` MCP server, `gws`, `~/.config/stonks/config.json`) and that those come from the dotfiles changes named above. `/stonks:sync` does not go in the generic "Slash commands (from plugins)" table, for the same reason as `/autonomous:run`. The existing marketplace auto-update row covers all three plugins. No README change, matching the repo's policy for Claude Code plugins.

## Risks / Trade-offs

- **Applying before the plugin is released fails the install** → merge ordering above; the install script's plugin loop reports the failure per plugin, so the other plugins are unaffected.
- **Background refresh can change behavior without a dotfiles commit** → accepted marketplace trade-off, same as `datf-lab`.
- **Manual can drift from upstream** → document only the synopsis, the flag, and the requirements, and link the upstream README for the rest.
- **Plugin enabled before the sibling tooling lands** → harmless: the command is manual-only and reports what is missing when run.

## Migration Plan

1. Confirm the upstream `stonks` plugin is merged and released, then merge this change.
2. Add the IDs to `CC_PLUGINS`, `enabledPlugins`, and the non-macOS guidance. Update parity and the manual.
3. Apply. On macOS, confirm the Claude Code plugin dependencies group. On non-macOS, run the printed command.
4. Reload Claude Code and check that `/stonks:sync` is listed.
5. Rollback: remove the two entries and the guidance line, then reapply. Remove the installed plugin explicitly with `claude plugin uninstall stonks@daily-agentic-task-force` if wanted.
