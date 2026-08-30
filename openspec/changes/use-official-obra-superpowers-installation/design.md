## Context

See `proposal.md` for motivation and `specs/opencode-user-config/spec.md` for the OpenCode behavior contract. The Codex contract will live in `specs/codex-plugins/spec.md`, and the four-tool parity contract will live in `specs/sync-agent-config-skill/spec.md`. The current bootstrap clones Obra Superpowers into `~/.config/opencode/superpowers` and creates plugin and skill symlinks under `~/.config/opencode/`. Obra's official OpenCode installation instead delegates fetching, plugin loading, and skill registration to OpenCode through a git-backed package spec in the `plugin` array.

The global OpenCode config is deployed from `dot_config/opencode/opencode.jsonc`. Existing machines may retain all three legacy Superpowers paths, and the interactive installer can currently recreate them. Claude Code installs Superpowers independently through its marketplace, while this repository has no Junie user-scope equivalent.

Codex App and Codex CLI install Superpowers from OpenAI's built-in `openai-curated` marketplace. Codex CLI 0.151.0 exposes stable `codex plugin add/list/remove` commands, and its authenticated marketplace reports `superpowers@openai-curated` as available. Installed-plugin state and cache paths under `~/.codex` are local, Codex-owned runtime state rather than a stable chezmoi configuration surface.

## Goals / Non-Goals

**Goals:**

- Establish harness-owned Superpowers installation and skill-discovery paths for OpenCode and Codex.
- Make migration deterministic for fresh and existing machines.
- Preserve unrelated OpenCode config, Plannotator installation, and Claude Code's separate Superpowers installation.
- Record parity decisions across Claude Code, OpenCode, Junie, and Codex, and make the operational restart requirements visible.

**Non-Goals:**

- Pinning Superpowers to a commit or maintaining a local fork.
- Changing Claude Code's marketplace configuration.
- Adding unsupported Junie user configuration.
- Removing or rebuilding OpenCode's package cache or runtime state.
- Installing Codex itself or managing Codex-owned plugin files, configuration, or cache through chezmoi.
- Enabling Codex's optional `multi_agent` feature.

## Decisions

### Register the official git-backed package in managed config

Add `superpowers@git+https://github.com/obra/superpowers.git` to `dot_config/opencode/opencode.jsonc` as the final plugin entry. OpenCode will fetch and load the plugin after restart, and the plugin will expose Superpowers through OpenCode's native skill mechanism. No `skills.paths` entry is needed because the current config has none and the official plugin performs skill registration.

This follows Obra's supported installation contract and removes local plugin lifecycle code. Retaining the clone-and-symlink flow was rejected because it can load a stale or duplicate copy and leaves updates outside OpenCode's package management.

### Use Codex's built-in curated marketplace without managing runtime state

Install Superpowers non-interactively with `codex plugin add superpowers@openai-curated`. The Codex App Plugins UI and interactive `/plugins` browser are equivalent alternatives, while `codex plugin list --json` provides a stable verification surface. Codex owns the resulting local installation record, plugin bundle, and cache. The repository will document the supported commands but will not create files under `~/.codex`, manipulate plugin cache paths, or add a clone or skill symlink.

Directly managing Codex's cache or config was rejected because those are tool-owned runtime state. Adding a custom marketplace was also rejected because authenticated Codex already provides `openai-curated`. Codex and authenticated marketplace access are prerequisites; if the plugin is unavailable, the installation task must pause rather than add an unsupported source or fallback installation.

### Use chezmoi's removal manifest for one-way cleanup

Add these exact target paths to `.chezmoiremove`:

- `.config/opencode/plugins/superpowers.js`
- `.config/opencode/skills/superpowers`
- `.config/opencode/superpowers`

This makes cleanup part of every applicable `chezmoi apply`, independent of whether the user reruns an interactive installer group. Cleanup inside the installer was rejected because users can skip that group; manual instructions were rejected because they cannot guarantee a single active installation.

### Keep Group 7 focused on Plannotator

Remove only the Superpowers clone and symlink block from `run_onchange_install-packages.sh.tmpl`. Retain Plannotator's dependency installation and update the group prompt so it no longer claims to install Superpowers. This prevents fresh setups from recreating paths that `.chezmoiremove` owns as obsolete.

### Record cross-agent parity across all four tools

Extend the `sync-agent-config` workflow and parity-table schema so every capability evaluates Claude Code, OpenCode, Junie, and Codex. The Superpowers row maps Claude Code's existing `superpowers@superpowers-marketplace` plugin, OpenCode's official git-backed package, Junie's `none` gap, and Codex's official marketplace plugin. No tool cell may be blank.

Parity means equivalent capability, not identical package transport or state ownership. Claude Code files remain unchanged. For Codex, the skill names `superpowers@openai-curated` and the stable `codex plugin` CLI as the target surface and records that installation state is runtime-owned; it must not invent a chezmoi file or manipulate Codex-owned cache paths. Future parity proposals must include all four tools, using a concrete managed file, an official runtime-owned surface, an already-satisfied counterpart, or an explicit capability gap.

### Document installation state and verify at both source and runtime boundaries

Add Superpowers to the OpenCode plugin inventory and document the official Codex marketplace workflow in `docs/manual.html`; leave `README.md` unchanged because neither the major tool list nor setup command changes. Source-level verification will check the exact OpenCode plugin ordering, absence of legacy installer commands, parity row, both documentation entries, and OpenSpec validity. Deployment verification will use `chezmoi apply --dry-run --verbose` before any live OpenCode cleanup.

OpenCode runtime verification requires quitting and restarting OpenCode, checking startup output for plugin-load errors, and confirming Superpowers appears through the native `skill` tool. Codex runtime verification requires confirming the marketplace reports Superpowers installed, fully restarting Codex, and confirming a fresh session discovers and can invoke the bundled `using-superpowers` skill.

## Risks / Trade-offs

- [A git-backed package can remain at a cached or lockfile-selected revision] -> Verify startup and skill discovery after restart; troubleshoot OpenCode's cache or lockfile only if the runtime check fails.
- [`.chezmoiremove` deletes matching targets unconditionally] -> Limit entries to the three Superpowers-owned legacy paths and inspect `chezmoi apply --dry-run --verbose` before applying.
- [The running OpenCode process does not reload config changes] -> Make a full quit and restart an explicit migration and verification step.
- [A failed plugin fetch could temporarily leave Superpowers unavailable after legacy cleanup] -> Validate network-backed plugin loading before considering the migration complete; the upstream repository can be fetched again and contains no unique local state.
- [Claude Code, OpenCode, and Codex use different update mechanisms while Junie has no managed equivalent] -> Preserve each supported harness-specific mechanism and record Junie's gap rather than attempting to normalize transport or state ownership.
- [Codex plugin installation is local runtime state and not reproduced by `chezmoi apply`] -> Document the CLI step explicitly and require runtime verification instead of claiming repository convergence proves installation.
- [Codex or authenticated marketplace access may be unavailable] -> Treat both as prerequisites and pause the Codex installation task without installing Codex or using an unsupported fallback.
- [The marketplace listing or bundled plugin version may change] -> Select the official Superpowers listing and verify the installed plugin exposes its bundled skill at runtime.

## Migration Plan

1. Update the managed OpenCode plugin array, simplify Group 7, add the three removal-manifest entries, and update the parity skill, table, evals, and OpenCode and Codex manual documentation.
2. Add the Codex plugin and four-tool parity behavior contracts, then run source-level checks and strict OpenSpec validation.
3. Run `chezmoi apply --dry-run --verbose` and confirm only the expected legacy Superpowers targets are scheduled for removal alongside the intended config deployment.
4. Apply the dotfiles when ready, then fully quit and restart OpenCode so it installs and loads the git-backed plugin.
5. Inspect startup output for plugin errors and use OpenCode's native `skill` tool to confirm Superpowers discovery.
6. Once Codex and authenticated marketplace access are available, run `codex plugin add superpowers@openai-curated`.
7. Fully quit and restart Codex, confirm the marketplace still reports Superpowers installed, and verify a fresh session can discover and invoke `using-superpowers`.

For OpenCode rollback after an apply, revert the managed plugin and removal-manifest changes, then restore the previous clone and symlinks from Obra's repository if the legacy installation is intentionally required. No user-authored state needs recovery from the removed paths. For Codex rollback, run `codex plugin remove superpowers@openai-curated`; no chezmoi-managed file needs restoration.
