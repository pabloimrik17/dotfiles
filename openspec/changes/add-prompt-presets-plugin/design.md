# Design

## Context

- `extraKnownMarketplaces.monolab` points to `pabloimrik17/monolab` with `autoUpdate: true` and no `ref`. Claude Code therefore reads the repo's default branch, which is `develop` (verified: `gh api repos/pabloimrik17/monolab --jq .default_branch`, and the local clone at `~/.claude/plugins/marketplaces/monolab` sits on `develop` at `8373de9`).
- `develop:.claude-plugin/marketplace.json` lists `prompt-presets` `0.1.0`; `main` does not. The plugin ships one command, `/prompt-presets:matt-retro` (`disable-model-invocation: true`).
- Two patterns exist for monolab-style plugins: `commander@monolab` is only in `enabledPlugins`; the DATF plugins are in `CC_PLUGINS`, `enabledPlugins`, the non-macOS guidance and the parity table.
- The preset's body starts with `/retro`, Matt Pocock's `retro` skill. `claude-plugins-official` pins `mattpocock-skills` at `c55ee46` (2026-09-18), which predates `retro` (`a7d038f`, 2026-09-24).
- `mattpocock/skills` ships its own `.claude-plugin/marketplace.json`: marketplace `mattpocock`, one plugin `mattpocock-skills` with `source: "./"`. On `main` (`d81f3a1`) its manifest lists 27 skills, including `retro`; 11 are model-invocable and 16 set `disable-model-invocation: true`.
- An installed plugin with no `enabledPlugins` key is disabled (verified: the three `@expo-plugins` plugins report `enabled: false`).

## Goals / Non-Goals

**Goals:**

- Install and enable `prompt-presets@monolab` on every machine through the existing flows.
- Deliver Matt Pocock's `retro` skill to Claude Code through the plugin channel.

**Non-Goals:**

- Backfilling `commander@monolab` into `CC_PLUGINS`. It is a separate pre-existing gap.
- Making `/prompt-presets:matt-retro` load `retro`. That fix lives in monolab (D6).
- Changing which monolab branch the marketplace serves.
- The standalone `resolving-merge-conflicts` install for OpenCode and Junie, which upstream removed from `mattpocock/skills`. It is a separate pre-existing gap.

## Decisions

**D1. Keep the marketplace on the default branch.** No `ref` is added. `develop` already serves the plugin, so it installs today. Rejected: `ref: main`, which would hide `prompt-presets` and move `commander`/`experiments`/`expo-developer` to the release branch, a separate decision. Also rejected: waiting for a `develop` → `main` promotion, which the marketplace does not need.

**D2. Full provisioning, DATF pattern.** Add the plugin to `CC_PLUGINS`, `enabledPlugins` and the non-macOS guidance. An `enabledPlugins` entry alone does not install anything (the spec calls it inert). Rejected: commander's enablement-only shape, which needs a manual `/plugin` install on every new machine.

**D3. Placement.** In `enabledPlugins`, keep alphabetical order: after `posthog@claude-plugins-official`, before `sentry-mcp@sentry-mcp`. In `CC_PLUGINS`, group by marketplace: after `experiments@monolab`. In the non-macOS guidance, add `claude plugin marketplace add pabloimrik17/monolab && claude plugin install prompt-presets@monolab` next to the other plugin lines.

**D4. Move `mattpocock-skills` to Matt's own marketplace.** Register `mattpocock/skills` (marketplace `mattpocock`, `autoUpdate: true`, no `ref`) and install `mattpocock-skills@mattpocock` instead of `mattpocock-skills@claude-plugins-official`. The plugin name is unchanged, so skills keep the `mattpocock-skills:*` namespace. The plugin now follows Matt's default branch, as the monolab and DATF plugins follow theirs. The collection gains `retro`, `pr` and `implement-spec` and loses `resolving-merge-conflicts`. Retire the official copy by removing its `enabledPlugins` key in the settings modifier's `REMOVE` list; an installed plugin with no key is disabled, so no uninstall step is added. Rejected: a standalone skills.sh `retro` for `claude-code`, which breaks the plugin-only channel rule, adds a bare `retro` name, and duplicates once the official pin moves. Rejected: waiting for Anthropic to bump the pin.

**D5. Parity row with explicit gaps.** Add a `Prompt presets` row: `prompt-presets@monolab` under Claude Code, `none` for Codex, OpenCode and Junie. Monolab publishes the plugin only to the Claude marketplace. Rejected: copying the prompt into OpenCode commands or Codex prompts. That is an unmanaged copy of upstream content that drifts from the verbatim source (DATF precedent).

**D6. `retro` is user-only; the preset fix belongs to monolab.** `retro` sets `disable-model-invocation: true`. The Skill tool refuses it ("cannot be used with Skill tool due to disable-model-invocation"), and the docs rule out nested skill invocation and subagent `skills:` preload for such skills. So the `/retro` line in `prompt-presets` `0.1.0` is plain text, and the preset runs without `retro`. A command that injects the skill with `` !`cat <path>/SKILL.md` `` does load it (verified with a probe skill). That change belongs to the monolab plugin; until it ships, `/mattpocock-skills:retro` with the same prompt is the working path.

## Risks / Trade-offs

- [The marketplace serves unreleased `develop` code] → Same exposure as the other three `@monolab` plugins; accepted.
- [`mattpocock-skills` follows Matt's `main` without Anthropic's review, and its skill list can change without a dotfiles edit] → Same exposure as monolab and DATF; specs name no skill count.
- [`/prompt-presets:matt-retro` runs without `retro` until monolab injects it] → D6; the manual names the prerequisite.
- [Installing `mattpocock-skills@mattpocock` next to the installed official copy may conflict on the shared plugin name] → Verified on this machine during apply; if it conflicts, uninstall the official copy first.
- [The edit re-triggers the `run_onchange_` install script] → Only pending steps act; already-installed items are skipped.

## Migration Plan

`chezmoi apply` removes the official `enabledPlugins` key and re-runs the install script; confirming the Claude Code plugin group registers `mattpocock/skills` and installs both plugins. Optional cleanup: `claude plugin uninstall mattpocock-skills@claude-plugins-official`. Rollback: revert the entries, run `claude plugin uninstall prompt-presets@monolab` and `claude plugin uninstall mattpocock-skills@mattpocock`, and reinstall the official copy.
