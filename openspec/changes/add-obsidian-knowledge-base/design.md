# Design

## Context

- Obsidian 1.13.7 is installed on the personal Mac as an on-request cask that the install script does not declare. Its CLI was registered by hand: `/usr/local/bin/obsidian` is a symlink to `Obsidian.app/Contents/MacOS/obsidian-cli`.
- The CLI needs the app running, and the first command launches it. Turning it on is an in-app toggle (Settings → General).
  - The toggle is stored as the top-level `"cli": true` in `~/Library/Application Support/obsidian/obsidian.json`; with the key absent, the CLI refuses with "Command line interface is not enabled".
  - The app rewrites that file while it runs.
- The experiments plugin writes run knowledge to `userConfig.knowledge_root`, which defaults to `~/.claude/experiments/knowledge`. `bootstrapVault` always creates `<root>/.obsidian/app.json`, `Runs.base`, `Packages.base` and `index.json` when they are missing. `index.json` is derived and stores the absolute root.
- Claude Code stores non-sensitive `userConfig` answers in `pluginConfigs.<plugin>.options`, and reads them only from user or managed settings. `modify_settings.json.tmpl` already merges `pluginConfigs` key by key for `cc-plugin-agents-md@builtin`.
- Codex reads only `~/.codex/AGENTS.md` at user scope, and that file holds Plannotator's managed block. Claude Code reads `~/.claude/CLAUDE.md` and `~/.claude/rules/*.md` at user scope, but not `~/.claude/AGENTS.md`.
- The `knowledge` repo and its content (layout, vault `AGENTS.md`, Bases, Obsidian Git) are created outside this change.

## Goals / Non-Goals

**Goals:**

- A fresh Mac of either machine type ends up with Obsidian, the vault checkout, the official skills in Claude Code and Codex, and run knowledge pointed into the vault.
- Every step that cannot complete says so (`managed-step-failure-visibility`).

**Non-Goals:**

- Managing the vault's content, or syncing it. Obsidian Git inside the vault owns pull, commit and push.
- Automating the CLI toggle or the Obsidian vault registry.

## Decisions

### One vault, with run knowledge in `updates/`

The run knowledge lives in a subfolder of the single knowledge base, not in a second vault. One graph lets a tool note link to its package hub, and there is one thing to sync.

`bootstrapVault` leaves a nested `updates/.obsidian/`. Obsidian ignores dot-folders, so it is harmless, and the vault's `.gitignore` drops it. Alternative: two vaults, which means two graphs and two sync stories.

### Private git repo, cloned by the install script

The install script clones the repo with `gh repo clone pabloimrik17/knowledge` and never pulls.

- **Alternative: `.chezmoiexternal` with `type = "git-repo"`.** Rejected. On a machine where `gh` is not yet authenticated it fails `chezmoi apply`, and its refresh pulls over local edits.
- **Alternatives: Obsidian Sync and iCloud.** Rejected. Sync is paid and adds Headless; iCloud gives no history.

The owner is hardcoded rather than taken from `gh` defaults. `gh repo clone knowledge` would resolve against whichever account `gh` is logged into, and on the work Mac that could be another account.

### Install-script group placement

The new group, "Knowledge base", goes right after Group 4 (casks), when `gh` (Group 1) and Obsidian are already present.

It runs only inside the macOS block. The non-macOS fallback prints the clone command and the plugin commands.

The CLI check runs only when `/Applications/Obsidian.app` exists. It checks two things: `readlink /usr/local/bin/obsidian` matches the bundled CLI path, and `obsidian.json` has `"cli": true`. It only warns.

- Creating the symlink needs sudo.
- Writing `cli` into `obsidian.json` races the running app, which rewrites the file.
- The in-app toggle does both, in one admin dialog.

### `knowledge_root` through managed `pluginConfigs`

The value goes in `MANAGED` as `pluginConfigs."experiments@monolab".options.knowledge_root`. `MERGE_CONTAINERS` gains `("pluginConfigs", "experiments@monolab")` and `(…, "options")`, so only this one option is owned.

The value is `~/WebstormProjects/knowledge/updates`: the plugin expands `~`, which keeps the setting free of usernames. It is not encrypted. `plugin-configs` encrypts plugin config *files* that hold personal values; a path inside the user's home does not qualify, and the existing `pluginConfigs` entry is plaintext too.

### Pointer rule, not an entry in a user instructions file

The pointer is a whole file chezmoi owns, `dot_claude/rules/knowledge-base.md`. It sits beside Plannotator's own rule and does not merge with it.

- **Alternative: `~/.claude/CLAUDE.md`.** It does not exist, and would become a catch-all.
- **Alternative: `~/.claude/AGENTS.md`.** It loads only because `~` happens to be an ancestor of the working directory.
- **Codex.** It would need a `modify_` script on Plannotator's `~/.codex/AGENTS.md`, and oxfmt mangles those. Deferred.

### Codex marketplaces as a name→source list

`CODEX_MARKETPLACES` holds `"obsidian-skills|obsidianmd/obsidian-skills"` rows. A plugin's marketplace is the part after `@`.

The group first registers the missing marketplaces that pending plugins need. A plugin whose marketplace failed to register is skipped with a warning. Built-in marketplaces (`openai-curated`) have no row and need no registration.

### No MCP

There is no official Obsidian MCP server. The community servers require the Local REST API plugin, which opens an HTTP port. The official CLI plus the skills cover the same ground.

## Risks / Trade-offs

- **The work Mac's `gh` is logged into an account that cannot read the repo.** The clone fails and warns with the manual command. The run continues.
- **A deep update runs before the clone and creates `~/WebstormProjects/knowledge/updates/`.** The path then exists without `.git` and the installer warns. To recover: move the directory aside, clone, and copy `updates/` back.
- **Both Macs append to the same package hub.** Git conflicts are possible in `updates/`. Runs are infrequent, `index.json` is gitignored (derived), and the conflicts are resolved by hand through Obsidian Git.
- **`obsidian-skills` and the vault's Obsidian Git plugin update unpinned.** This matches the other auto-updating marketplaces. Obsidian is a cask with `auto_updates`, which cannot be pinned.
- **The vault holds `work`-scope notes in a personal private repo.** Accepted in the grill: no isolation is required.

## Migration Plan

1. Out of band, already started: create the `knowledge` repo and copy `~/.claude/experiments/knowledge` into `updates/`, with the index rebuilt for the new root.
2. Merge this change and run `chezmoi update` on each Mac. The settings now carry `knowledge_root`.
3. On the personal Mac:
   1. Check that `match-knowledge.mjs` with no `--root` resolves the new root and finds a migrated package.
   2. Delete `~/.claude/experiments/knowledge` and remove its entry from Obsidian's vault list. Both vaults are named `knowledge`, and `vault=knowledge` opens the old one until that entry is gone.
4. Rollback: drop the managed `knowledge_root` (an empty value restores the default), then copy `updates/` back to the old path.

## Open Questions

- The Codex manifest declares `"authentication": "ON_INSTALL"` for `obsidian`. Whether `codex plugin add` prompts in a TTY, or needs `--yes`, is checked during apply. It does not change the specs.
