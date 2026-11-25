# Design

## Context

See proposal.md for why. Current state:

- Group 9 installs skills through `install_skill <repo> <name> [agents]`, which skips a skill when the cached `npx -y skills list -g --json` holds that name with every requested agent. The cache is read once, at the start of the group.
- `skills list -g --json` reports `name`, `source`, `renamedFrom` and `agents` per skill. skills.sh keeps one canonical folder per flat name (`~/.agents/skills/<name>`) shared by every agent; Claude Code and Junie see it through symlinks.
- CodeRabbit's lines (`code-review`, `autofix`, no `--agent`) come before Matt Pocock's (`--agent opencode junie`).
- `CC_PLUGINS_RETIRED` holds `old:replacement` pairs and uninstalls the old plugin only once its replacement is installed.
- `enabledPlugins` is a merge container in `modify_settings.json.tmpl`: dropping a key from the template leaves it in the live file. `REMOVE` deletes paths.
- fallow is the precedent for a global npm CLI (Group 6.5).

## Goals / Non-Goals

**Goals:**

- Reach the same end state on a fresh machine, on a machine with the old skill, and on the personal Mac already fixed by hand, where the run must be a no-op for skills and Greptile.
- Never leave a machine with neither CodeRabbit skill, and never let Matt Pocock's `code-review` take over the folder that Claude Code still links to.

**Non-Goals:**

- A general guard against any skill shadowing any built-in. The warning covers `code-review` only.
- A removal line in the non-macOS fallback: it serves fresh hosts.

## Decisions

**D1. Rename with skills.sh `--rename`, not CodeRabbit's Claude Code plugin.** `--rename` is a documented skills.sh option for two sources publishing one name; the lock keeps the original name in `skillName`, so `skills update` still finds the skill. CodeRabbit's plugin (`coderabbit@claude-plugins-official`) is namespaced and does not shadow, but brings a hosted MCP server with OAuth and the `review` scope, its own subagents and `autofix`, and lags the source. Dropping the skill loses the CLI runbook. The name matches upstream's pending rename (coderabbitai/skills#83).

**D2. `install_skill` takes an optional installed name.** The CodeRabbit line passes `coderabbit-review`; the skip check and the `--rename` flag use it. Other lines are unchanged.

**D3. Remove the old copy after the new one, guarded by source.** Right after the CodeRabbit line, the group re-reads the skills list. If `coderabbit-review` is present and `code-review` has `source == "coderabbitai/skills"` and a null `renamedFrom`, it runs `npx -y skills remove code-review -g -y`, which clears every agent link and the lock entry. If `coderabbit-review` is missing, the old copy stays, matching `CC_PLUGINS_RETIRED`. Without `jq` the source cannot be checked, so the removal is skipped with a warning.

**D4. Refresh the cache before Matt Pocock's `code-review`.** The old CodeRabbit entry covers OpenCode and Junie, so a stale cache makes `install_skill` skip Matt's `code-review` as already installed. After a removal the group re-reads the list. Matt's `code-review` then installs only when no `code-review` from another source remains. Otherwise skills.sh would overwrite the shared folder, and the surviving `~/.claude/skills/code-review` link would hand the flat name to Matt's skill in Claude Code, with a lock no longer saying CodeRabbit, so D3 would never fire again.

**D5. Warn at the end of Group 9** when `~/.claude/skills/code-review` exists, as a file or a link. Chosen in the grill over a test alone.

**D6. A separate `CC_PLUGINS_REMOVED` list, not an empty replacement in `CC_PLUGINS_RETIRED`.** The pair format means "uninstall once the replacement is in"; an empty replacement would mix two meanings. The removed list adds to `PENDING_RT`, so it triggers the same confirmation, and its uninstall runs in the same post-install pass. The settings `REMOVE` entry is unconditional: the key goes on every host.

**D7. Greptile through `npm install -g greptile`, in a group after fallow.** The tap formula depends on Homebrew's `node`, a second Node that on the Intel host lands in `/usr/local/bin` and shadows nvm in non-interactive shells. The official script's `auto` mode tries brew first; forcing `GREPTILE_INSTALL_METHOD=npm` gives the same result behind a `curl | bash`. The group checks Node ≥ 22 with `node -p` before installing. This departs from the rule that brew-available tools join the brew freeze; the `greptile-install` spec records why.

## Risks / Trade-offs

- [CodeRabbit merges #83 and the source folder becomes `coderabbit-review`] → `skills update` can no longer find `skills/code-review`; beads `agentic-task-8817`, deferred to 2026-12-06, drops `--rename`.
- [Greptile lives in nvm's current Node] → a new nvm default loses it, as with fallow; the next run of the script reinstalls it because `command -v greptile` fails.
- [The old `/review-team` command loses its `/code-review:code-review` reviewer] → accepted until the follow-up task deletes the command; its `/code-review` reviewer now reaches the built-in.
- [The `gh-dash-keybindings` spec still names `/code-review:code-review`] → the follow-up task rewrites it with the other review-team specs.
- [skills.sh's audit rates `coderabbit-review` Critical on Snyk] → same content as the `code-review` it replaces; no new exposure.

## Migration Plan

1. Personal Mac, done by hand on 2026-11-22: `coderabbit-review` installed, old `code-review` removed, Matt Pocock's `code-review` for OpenCode and Junie, `greptile` 3.8.0 through npm. After merge, `chezmoi update` and the install script must change nothing for skills and Greptile, uninstall the official plugin, and delete its `enabledPlugins` key.
2. Work Mac: the first real run of D3 and D4, on a machine with the old skill. Check `skills list -g`, `ls ~/.claude/skills/code-review` and `claude plugin list`.
3. Rollback: `npx -y skills remove coderabbit-review -g -y`, `npx -y skills add coderabbitai/skills --skill code-review -g -y`, `claude plugin install code-review@claude-plugins-official`, and revert the commit.
