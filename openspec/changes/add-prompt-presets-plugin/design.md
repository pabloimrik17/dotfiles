# Design

## Context

- `extraKnownMarketplaces.monolab` points to `pabloimrik17/monolab` with `autoUpdate: true` and no `ref`. Claude Code therefore reads the repo's default branch, which is `develop` (verified: `gh api repos/pabloimrik17/monolab --jq .default_branch`, and the local clone at `~/.claude/plugins/marketplaces/monolab` sits on `develop` at `8373de9`).
- `develop:.claude-plugin/marketplace.json` lists `prompt-presets` `0.1.0`; `main` does not. The plugin ships one command, `/prompt-presets:matt-retro` (`disable-model-invocation: true`).
- Two patterns exist for monolab-style plugins: `commander@monolab` is only in `enabledPlugins`; the DATF plugins are in `CC_PLUGINS`, `enabledPlugins`, the non-macOS guidance and the parity table.

## Goals / Non-Goals

**Goals:**

- Install and enable `prompt-presets@monolab` on every machine through the existing flows.

**Non-Goals:**

- Backfilling `commander@monolab` into `CC_PLUGINS`. It is a separate pre-existing gap.
- Delivering the `retro` skill to Claude Code (D4).
- Changing which monolab branch the marketplace serves.

## Decisions

**D1. Keep the marketplace on the default branch.** No `ref` is added. `develop` already serves the plugin, so it installs today. Rejected: `ref: main`, which would hide `prompt-presets` and move `commander`/`experiments`/`expo-developer` to the release branch, a separate decision. Also rejected: waiting for a `develop` → `main` promotion, which the marketplace does not need.

**D2. Full provisioning, DATF pattern.** Add the plugin to `CC_PLUGINS`, `enabledPlugins` and the non-macOS guidance. An `enabledPlugins` entry alone does not install anything (the spec calls it inert). Rejected: commander's enablement-only shape, which needs a manual `/plugin` install on every new machine.

**D3. Placement.** In `enabledPlugins`, keep alphabetical order: after `posthog@claude-plugins-official`, before `sentry-mcp@sentry-mcp`. In `CC_PLUGINS`, group by marketplace: after `experiments@monolab`. In the non-macOS guidance, add `claude plugin marketplace add pabloimrik17/monolab && claude plugin install prompt-presets@monolab` next to the other plugin lines.

**D4. `retro` stays an upstream prerequisite.** The command body calls `/retro` as plain text. Claude maps it to Matt Pocock's `retro` skill; without that skill the prompt still runs, just without the skill's guidance. Upstream added `retro` in `a7d038f` (2026-09-24). `claude-plugins-official` pins `mattpocock-skills` at `c55ee46` (2026-09-18), so the plugin channel lacks it today. A standalone skills.sh install for `claude-code` would break the `matt-pocock-skills` channel rule (Claude Code gets Matt's skills only through the plugin). Accepted: the gap closes when the official marketplace bumps its pin.

**D5. Parity row with explicit gaps.** Add a `Prompt presets` row: `prompt-presets@monolab` under Claude Code, `none` for Codex, OpenCode and Junie. Monolab publishes the plugin only to the Claude marketplace. Rejected: copying the prompt into OpenCode commands or Codex prompts. That is an unmanaged copy of upstream content that drifts from the verbatim source (DATF precedent).

## Risks / Trade-offs

- [The marketplace serves unreleased `develop` code] → Same exposure as the other three `@monolab` plugins; accepted.
- [`/prompt-presets:matt-retro` runs without `retro` guidance until the official pin moves] → The manual names the prerequisite; no workaround (D4).
- [The edit re-triggers the `run_onchange_` install script] → Only pending steps act; already-installed items are skipped.

## Migration Plan

`chezmoi apply` re-runs the install script; confirming the Claude Code plugin group installs the plugin. Rollback: revert the entries and run `claude plugin uninstall prompt-presets@monolab`.
