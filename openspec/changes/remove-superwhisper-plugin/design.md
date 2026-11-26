# Design

## Context

Today only Claude Code gets the plugin from the dotfiles. Three places wire it in:

- `dot_claude/modify_settings.json.tmpl` adds `enabledPlugins["superwhisper@superwhisper"]` and `extraKnownMarketplaces.superwhisper` on `darwin/arm64`. On other hosts it lists both keys in `REMOVE`.
- `run_onchange_install-packages.sh.tmpl`, Group 8.25, runs `curl -fsSL https://superwhisper.com/install-claude-code.sh | bash` on `darwin/arm64`.

Superwhisper also ships installers for Codex (`superultrainc/superwhisper-codex`) and OpenCode (`@superwhisper/opencode`). The app can run them from its own UI. Any copy they installed lives only in each agent's runtime state.

Each agent CLI was tested in a throwaway config dir: Claude Code 2.1.332 (`CLAUDE_CONFIG_DIR`), Codex 0.171.0 (`CODEX_HOME`) and OpenCode 2.4.1 (temporary XDG dirs).

| Agent | Install writes | Removal | Leftover |
| --- | --- | --- | --- |
| Claude Code | `marketplace add` writes `extraKnownMarketplaces.superwhisper` to settings. `install` writes `enabledPlugins`. | `uninstall` drops the `enabledPlugins` key. `marketplace remove` drops the settings key and the `known_marketplaces.json` entry. | `plugins/cache/superwhisper` |
| Codex | `[marketplaces.superwhisper]` and `[plugins."superwhisper@superwhisper"]` in `config.toml` | `plugin remove` and `marketplace remove` delete both tables. A repeated `remove` exits 0. | `plugins/cache/superwhisper` |
| OpenCode 2 | Package name added to `opencode.jsonc` if that file exists, otherwise to `opencode.json` | `plugin remove` edits `opencode.json` if that file exists, otherwise `opencode.jsonc` | package cache |

`opencode plugin list` needs the managed service. It also printed "No plugins found" while `opencode.jsonc` listed three plugins. It cannot be used for detection.

## Goals / Non-Goals

**Goals:**

- Remove existing copies from Claude Code, Codex and OpenCode without a manual step on each Mac.
- Use the chezmoi mechanism built for one-shot work instead of adding a check that runs forever.

**Non-Goals:**

- Deleting the cache directories each agent leaves behind. Each agent owns them. The `codex-plugins` spec keeps Codex state runtime-owned.
- Stopping a later reinstall from the Superwhisper app.
- Pi. Its upstream installer returns 404, and the user named only three agents.

## Decisions

### 1. A `run_once_after_` script, not `.chezmoiremove` or an install-script group

`run_once_after_remove-superwhisper-agent-plugins.sh.tmpl` holds the cleanup.

chezmoi records a `run_once_` script by the SHA256 of its rendered content, and only after the script succeeds. So a successful run never repeats on that machine, and a failed run is retried on the next apply. `after_` makes it run after every file is written and after `run_onchange_install-packages.sh`. That script has no `before_`/`after_` attribute, so it runs during the file phase. Inside the after phase, scripts run in target-name order. `remove-…` sorts after `claude-swap-setup.sh`, so this is the last script and a failure skips nothing after it.

Alternatives considered:

- `.chezmoiremove` or `remove_`. Rejected: they only delete files. Plugin state spans settings keys, JSON records, TOML tables and caches that each agent keeps consistent. Deleting files leaves those records out of sync and would make the dotfiles manage Codex plugin state.
- A group inside `run_onchange_install-packages.sh.tmpl`. Rejected: it would re-query three CLIs every time the installer changes, forever, and that file is already about 2000 lines.
- A manual one-time cleanup listed in `tasks.md`. Rejected: the user wants the dotfiles to do it.

### 2. Each agent's own CLI does the removal

The script only runs `claude plugin …`, `codex plugin …` and `opencode plugin …`. Driving the official CLI does not count as managing Codex state (`codex-plugins`, "Codex plugin state remains runtime-owned").

Detection, before any removal:

- Claude Code: `claude plugin list --json` for `id == "superwhisper@superwhisper"`, and `claude plugin marketplace list --json` for `name == "superwhisper"`.
- Codex: the `installed` array of `codex plugin list --json` for `pluginId`, and `codex plugin marketplace list --json` `.marketplaces[].name`.
- OpenCode: search `~/.config/opencode/opencode.json` and `opencode.jsonc` for `@superwhisper/opencode`, then run `opencode plugin remove` with each exact specifier found. A file that still lists it afterwards is named in the error, since with both files present the CLI edits only `opencode.json`.

The plugin and the marketplace are checked separately, so a marketplace left over from a half-finished install is still removed. After removing, the script queries again and fails if anything is still listed, per `managed-step-failure-visibility`.

`jq` parses the JSON. An entry without the key being matched makes the listing unreadable, so a renamed field cannot read as "not installed". macOS 15 and later ship `/usr/bin/jq`; the install script does not install it. Without `jq` the run names Claude Code and Codex as failed, with a hint, and retries.

### 3. Drop the superwhisper entries from the settings merge's `REMOVE`

`claude plugin uninstall` and `claude plugin marketplace remove` delete both settings keys themselves. Keeping them in `REMOVE` would strip them on every apply, forever. That would undo a reinstall the user chose to make from the app, and it would be stricter than the one-shot cleanup used for Codex and OpenCode.

Order on an Apple Silicon Mac that has the plugin:

1. The `modify_` merge runs during the file phase. Both keys are now outside `MANAGED` and `REMOVE`, so the merge keeps them as foreign keys.
2. The `after_` cleanup uninstalls through the CLI, which deletes both keys.
3. Later applies find nothing to keep or add.

Intel hosts already had both keys stripped by earlier applies.

`claude-settings-merge` ("Host-conditional keys are removed as well as added") does not change. With superwhisper gone, no host-conditional keys remain, and the requirement still applies to future ones. The `REMOVE` comment that calls these entries "host-conditional" gets rewritten.

### 4. No confirmation prompt

The other installer groups use `confirm`, but here a declined prompt would end in exit 0. A TTY-less `confirm` also answers no. Either way chezmoi would record the script as done and the plugins would never be removed. Removal is reversible with the upstream installers, so asking adds nothing.

### 5. Per-agent failures, one combined exit status

Each agent block catches its own failure, records the agent name and continues. The script exits 1 if any block failed and prints the agents that failed. A missing CLI (`command -v` fails) means nothing to remove: the script prints an info line and the block succeeds.

### 6. macOS only, any architecture

The script is wrapped in `{{ if eq .chezmoi.os "darwin" }}`. On Linux it renders empty, and chezmoi skips empty scripts. Architecture is not checked: the app's UI can install the Codex and OpenCode plugins on Intel too.

### 7. Tests stub the agent CLIs

`tests/agent-plugin-retirement.test.ts` renders the script with `chezmoi execute-template` and `darwin` data, then runs it with fake `claude`, `codex` and `opencode` executables on `PATH`. This follows `tests/codex-plugins.test.ts`. The fakes keep state in a temp dir and log their calls, so tests can check removals, re-checks, skips and failure exits without touching real agent config.

## Risks / Trade-offs

- [Superwhisper changes a plugin or marketplace name] → Detection misses it and the run passes. Mitigation: the names match all three published installers as of 2026-11-25. Editing the script re-runs it once on every Mac.
- [The `--json` shape of an agent CLI changes] → The listing is unreadable, so the run fails and retries instead of passing silently.
- [A failed run shows an error on every `chezmoi apply` until fixed] → This is intended. The message names the agent.
- [An open agent session keeps the plugin loaded] → Removal takes effect when the session restarts. The app's hook binary is still on disk, so hooks don't break in the meantime.
- [The script stays in the repo after every Mac has run it] → Deleting a `run_once_` script later runs nothing. It can go in a later cleanup change.
- [Leftover caches] → Each agent owns its cache. Not touched (Non-Goals).

## Migration Plan

1. Merge to `main`.
2. On each Mac, run `chezmoi update`, not a plain `chezmoi apply`, so the chezmoi source picks up `main`. The cleanup runs once at the end.
3. Check with `claude plugin list --json`, `codex plugin list --json`, and a search of `~/.config/opencode/opencode.json*`. None should mention superwhisper.
4. Rollback: revert the commit, then reinstall the plugins by hand with the upstream installers. The cleanup does not run again on its own.
