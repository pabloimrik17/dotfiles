# Tasks

## 1. Obsidian cask

- [x] 1.1 Add `obsidian|Obsidian|Productivity|Knowledge base` to `ALL_CASKS` after `adobe-acrobat-reader`. Verify with a new `tests/install-script.test.ts` case: the rendered core set has 22 rows on `arm64`, 21 on `amd64`, and includes the row. Also confirm `BREW_VERSIONS` and the pin lists do not name `obsidian`.
- [x] 1.2 Add Obsidian to the README "What's Included" table via the `update-readme` skill. Verify the row renders.

## 2. Knowledge-base install group

- [x] 2.1 Add a "Knowledge base" group after Group 4 in the macOS block. The clone branch:
  - Path absent, `gh auth status` ok and the user confirms: clone with `gh repo clone pabloimrik17/knowledge`.
  - `gh` missing or unauthenticated: warn and print the manual command.
  - Clone fails: warn, and remove only a directory this attempt created.
  - User declines: report the skip.

  Keep the paths overridable so tests can point them at a temp dir. Verify with `bash -n` on the darwin render.
- [x] 2.2 In the same group, handle an existing path:
  - `.git` present: report it as present and run no git command.
  - No `.git`: warn and leave the contents untouched.

  Also add the CLI check: when the app exists and either `readlink /usr/local/bin/obsidian` is not the bundled `obsidian-cli` or `obsidian.json` lacks `"cli": true`, warn with the Settings → General steps. Never create the symlink or write `obsidian.json`. Verify by reading the darwin render.
- [x] 2.3 Add the clone command to the non-macOS fallback. Verify that it appears in the linux render.
- [x] 2.4 Add `tests/knowledge-base.test.ts` cases that run the sliced group with stubbed `gh` and `git` and a temp app/link path. Cover every scenario in `specs/knowledge-base/spec.md` for clone, existing path and CLI check. Verify `bun test tests/knowledge-base.test.ts` passes.
- [x] 2.5 Document the group in `docs/manual.html` via the `update-manual` skill: the vault location, the manual CLI toggle, and `gh auth login` before the clone. Add the CLI-toggle step to the README setup. Verify that both mention `~/WebstormProjects/knowledge`.

## 3. Claude Code plugin, settings and rule

- [x] 3.1 Add `obsidianmd/obsidian-skills` to `CC_MARKETPLACES`, `obsidian@obsidian-skills` to `CC_PLUGINS`, and the add+install line to the non-macOS fallback. Verify with an array-extraction test like the one in `tests/ibkr-mcp.test.ts`.
- [x] 3.2 In `dot_claude/modify_settings.json.tmpl`:
  - Enable `obsidian@obsidian-skills`.
  - Register `extraKnownMarketplaces."obsidian-skills"` (`github` source `obsidianmd/obsidian-skills`, `autoUpdate: true`, no `ref`).

  Verify with render and merge tests: the fresh render has both keys, and unrelated entries survive.
- [x] 3.3 Add `pluginConfigs."experiments@monolab".options.knowledge_root = "~/WebstormProjects/knowledge/updates"` to `MANAGED`. Add the plugin and `options` paths to `MERGE_CONTAINERS`. Verify with tests for the knowledge-root scenarios: fresh, unrelated options survive, a different value is replaced, and a repeat converges byte-identically.
- [x] 3.4 Create `dot_claude/rules/knowledge-base.md`. Keep it terse: the vault path, write only when asked, conventions in the vault `AGENTS.md`, and `updates/` is script-owned. Verify with a content test, and check that `chezmoi managed` from the worktree lists `.claude/rules/knowledge-base.md` and no other file under `.claude/rules/`.
- [x] 3.5 Document the plugin, `knowledge_root` and the rule in `docs/manual.html` via `update-manual`. Verify that the manual names `obsidian@obsidian-skills` and the rule path.

## 4. Codex plugin

- [x] 4.1 Add `CODEX_MARKETPLACES=("obsidian-skills|obsidianmd/obsidian-skills")` and `obsidian@obsidian-skills` to `CODEX_PLUGINS`. Inside the confirmed branch, before installing a plugin:
  - If its marketplace (the part after `@`) is listed, is missing from `codex plugin marketplace list --json`, and the user confirmed: register it.
  - On a failed query or add: warn and skip that marketplace's plugins.
  - Built-in marketplaces need no registration.

  Verify with stubbed-`codex` tests for the marketplace-missing, already-registered, add-fails and built-in scenarios.
- [x] 4.2 Resolve the design's open question: on this Mac, check whether `codex plugin add obsidian@obsidian-skills` prompts because of `authentication: ON_INSTALL`, and adjust the call if it does. Verify that `codex plugin list --json` reports it installed and enabled, and that a new Codex session lists `obsidian-cli`.
- [x] 4.3 Document the Codex plugin in `docs/manual.html` via `update-manual`. Verify that the manual names the marketplace source.

## 5. Integration checks

- [x] 5.1 Run `bun test`, `bash -n` on the darwin and linux renders, and `openspec validate add-obsidian-knowledge-base --strict`. Verify all pass.
- [x] 5.2 Run `chezmoi diff --source <worktree>` on this Mac. Verify the only target changes are the settings keys from 3.2–3.3, the new rule file and the install script.

## 6. Settings drift (stacked PR `fix/claude-settings-drift`)

- [x] 6.1 In `dot_claude/modify_settings.json.tmpl`, merge each managed `hooks.<Event>` by group: drop live groups that are AoE-owned or equal to a managed group, keep the rest in live order, append the managed groups. Update the comment above `MERGE_CONTAINERS`. Verify with merge tests for every scenario in `specs/claude-settings-merge/spec.md`, and by running the rendered script read-only on the live `~/.claude/settings.json`: the Rex `SessionStart` group survives and the AoE groups are unchanged.
- [x] 6.2 Rename `dot_config/gws` to `dot_config/private_gws`. Update `tests/gws-client-secret.test.ts` and every mention of the old source path outside `openspec/` (the main spec changes at archive). Verify `bun test tests/gws-client-secret.test.ts` passes and `chezmoi managed --source <worktree>` still lists `.config/gws/client_secret.json`.
- [x] 6.3 Rename the claude-hud source to `private_config.json` with only the customised keys, as 2-space JSON. Add it to `.oxfmtignore`. Verify with `tests/claude-hud-config.test.ts`: the exact key set, no `showConfigCounts` or `environmentThreshold`, and the `.oxfmtignore` entry.
- [x] 6.4 Update `docs/manual.html` via `update-manual` (and the README if a path or behaviour it names changed): foreign hooks survive apply, the hidden config counts. Verify that neither names `dot_config/gws/` or `environmentThreshold`.
- [x] 6.5 Integration. Verify:
  - `bun test` and `openspec validate add-obsidian-knowledge-base --strict` pass.
  - `chezmoi diff --source <worktree>` shows no removal of the Rex hook and no mode change on `~/.config/gws`. For claude-hud it shows only the intended key removals.

## Workflow follow-up

- Open both PRs with `gh stack submit` (`feature/add-obsidian`, then `fix/claude-settings-drift` on top). Merge bottom-up with `gh stack merge`.
- Run `chezmoi update` on each Mac only after both have merged.
- On the personal Mac, after apply:
  1. Check that `match-knowledge.mjs` with no `--root` resolves `~/WebstormProjects/knowledge/updates` and finds a migrated package.
  2. Delete `~/.claude/experiments/knowledge` and remove its entry from Obsidian's vault list. Both vaults are named `knowledge`, and `vault=knowledge` opens the old one until that entry is gone.
- On the work Mac: check the clone (or its warning) and the CLI warning.
- Archive the change after review.
