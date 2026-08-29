## Context

See `proposal.md` for motivation and `specs/opencode-user-config/spec.md` for the behavior contract. The current bootstrap clones Obra Superpowers into `~/.config/opencode/superpowers` and creates plugin and skill symlinks under `~/.config/opencode/`. Obra's official OpenCode installation instead delegates fetching, plugin loading, and skill registration to OpenCode through a git-backed package spec in the `plugin` array.

The global OpenCode config is deployed from `dot_config/opencode/opencode.jsonc`; its websearch-cited entry must remain last. Existing machines may retain all three legacy Superpowers paths, and the interactive installer can currently recreate them. Claude Code installs Superpowers independently through its marketplace, while this repository has no Junie user-scope equivalent.

## Goals / Non-Goals

**Goals:**

- Establish one OpenCode-owned Superpowers installation and skill-discovery path.
- Make migration deterministic for fresh and existing machines.
- Preserve unrelated OpenCode config, Plannotator installation, and Claude Code's separate Superpowers installation.
- Record the harness-specific parity decision and make the operational restart requirement visible.

**Non-Goals:**

- Pinning Superpowers to a commit or maintaining a local fork.
- Changing Claude Code's marketplace configuration.
- Adding unsupported Junie user configuration.
- Removing or rebuilding OpenCode's package cache or runtime state.

## Decisions

### Register the official git-backed package in managed config

Add `superpowers@git+https://github.com/obra/superpowers.git` to `dot_config/opencode/opencode.jsonc` immediately before the final websearch-cited entry. OpenCode will fetch and load the plugin after restart, and the plugin will expose Superpowers through OpenCode's native skill mechanism. No `skills.paths` entry is needed because the current config has none and the official plugin performs skill registration.

This follows Obra's supported installation contract and removes local plugin lifecycle code. Retaining the clone-and-symlink flow was rejected because it can load a stale or duplicate copy and leaves updates outside OpenCode's package management.

### Use chezmoi's removal manifest for one-way cleanup

Add these exact target paths to `.chezmoiremove`:

- `.config/opencode/plugins/superpowers.js`
- `.config/opencode/skills/superpowers`
- `.config/opencode/superpowers`

This makes cleanup part of every applicable `chezmoi apply`, independent of whether the user reruns an interactive installer group. Cleanup inside the installer was rejected because users can skip that group; manual instructions were rejected because they cannot guarantee a single active installation.

### Keep Group 7 focused on Plannotator

Remove only the Superpowers clone and symlink block from `run_onchange_install-packages.sh.tmpl`. Retain Plannotator's dependency installation and update the group prompt so it no longer claims to install Superpowers. This prevents fresh setups from recreating paths that `.chezmoiremove` owns as obsolete.

### Record cross-agent parity without forcing identical mechanisms

Add a parity-table row that maps the capability to Claude Code's existing `superpowers@superpowers-marketplace` plugin and OpenCode's official git-backed plugin package. Mark Junie as `none` and record that no supported user-scope counterpart is managed. Claude Code files remain unchanged because parity means equivalent capability, not identical package transport.

### Document installation state and verify at both source and runtime boundaries

Add Superpowers to the OpenCode plugin inventory in `docs/manual.html`; leave `README.md` unchanged because neither the major tool list nor setup command changes. Source-level verification will check the exact plugin ordering, absence of legacy installer commands, parity row, documentation row, and OpenSpec validity. Deployment verification will use `chezmoi apply --dry-run --verbose` before any live cleanup. Runtime verification requires quitting and restarting OpenCode, checking startup output for plugin-load errors, and confirming Superpowers appears through the native `skill` tool.

## Risks / Trade-offs

- [A git-backed package can remain at a cached or lockfile-selected revision] -> Verify startup and skill discovery after restart; troubleshoot OpenCode's cache or lockfile only if the runtime check fails.
- [`.chezmoiremove` deletes matching targets unconditionally] -> Limit entries to the three Superpowers-owned legacy paths and inspect `chezmoi apply --dry-run --verbose` before applying.
- [The running OpenCode process does not reload config changes] -> Make a full quit and restart an explicit migration and verification step.
- [A failed plugin fetch could temporarily leave Superpowers unavailable after legacy cleanup] -> Validate network-backed plugin loading before considering the migration complete; the upstream repository can be fetched again and contains no unique local state.
- [Claude Code and OpenCode use different update mechanisms] -> Preserve both supported harness-specific mechanisms and document the mapping rather than attempting to normalize them.

## Migration Plan

1. Update the managed OpenCode plugin array, simplify Group 7, add the three removal-manifest entries, and update parity and manual documentation.
2. Run source-level checks and strict OpenSpec validation.
3. Run `chezmoi apply --dry-run --verbose` and confirm only the expected legacy Superpowers targets are scheduled for removal alongside the intended config deployment.
4. Apply the dotfiles when ready, then fully quit and restart OpenCode so it installs and loads the git-backed plugin.
5. Inspect startup output for plugin errors and use OpenCode's native `skill` tool to confirm Superpowers discovery.

For rollback after an apply, revert the managed plugin and removal-manifest changes, then restore the previous clone and symlinks from Obra's repository if the legacy installation is intentionally required. No user-authored state needs recovery from the removed paths.
