# Proposal

## Why

Knowledge about tools and projects has no durable home that a person reads. Obsidian is the de facto tool for that and now ships an official CLI and agent skills. The experiments update commands already write run knowledge as an Obsidian-shaped vault, so it should live in that knowledge base. Obsidian itself is installed by hand and undeclared, so a new machine misses it.

## What Changes

- Declare `obsidian` as a core cask (Productivity) in the install script. No version pin: it self-updates and `brew pin` does not apply to casks.
- New install step for the **knowledge base**:
  - Clone the private `knowledge` repo to `~/WebstormProjects/knowledge` when it is absent and `gh` is authenticated. Otherwise warn.
  - Never pull. Never touch an existing directory; warn when it is not a git checkout.
  - Warn when the Obsidian CLI is not registered at `/usr/local/bin/obsidian`. Turning it on stays a manual one-time step.
  - Runs on both machine types.
- Point the experiments plugin's `knowledge_root` at `~/WebstormProjects/knowledge/updates` through managed `pluginConfigs`, so **run knowledge** lands inside the knowledge base.
- Install and enable the official `obsidian@obsidian-skills` Claude Code plugin from `obsidianmd/obsidian-skills`, with an auto-updating marketplace.
- Install `obsidian@obsidian-skills` in Codex. This first registers the `obsidianmd/obsidian-skills` marketplace through the Codex CLI.
- Deploy a managed user rule, `~/.claude/rules/knowledge-base.md`. It says where the knowledge base is, that agents write to it only when asked, and that the vault's `AGENTS.md` holds the conventions.
- Update the README and the manual.

Out of scope: an Obsidian MCP server, OpenCode, Obsidian Sync and Headless, and a Codex counterpart of the rule. Creating the `knowledge` repo is a one-off done outside dotfiles, and so is its content.

## Capabilities

### New Capabilities

- `knowledge-base`: making the knowledge base available on a machine. Covers the vault checkout, the Obsidian CLI registration check, where run knowledge is written, and the agent-facing pointer rule.

### Modified Capabilities

- `gui-app-install`: the core cask set gains `obsidian` under Productivity: 22 rows on `arm64`, 21 on `amd64`.
- `claude-code-plugins`: the `obsidian-skills` marketplace and the `obsidian@obsidian-skills` plugin are provisioned and enabled.
- `codex-plugins`: the installer registers the Codex marketplaces it needs and installs `obsidian@obsidian-skills`.

## Impact

- `run_onchange_install-packages.sh.tmpl`:
  - `ALL_CASKS`.
  - A new knowledge-base group after the cask group.
  - `CC_MARKETPLACES` and `CC_PLUGINS`.
  - A Codex marketplace list and `CODEX_PLUGINS`.
  - The non-macOS fallback text.
- `dot_claude/modify_settings.json.tmpl`: `enabledPlugins`, `extraKnownMarketplaces`, `pluginConfigs."experiments@monolab"` and `MERGE_CONTAINERS`.
- New `dot_claude/rules/knowledge-base.md`.
- `tests/install-script.test.ts`, plus the settings-merge tests.
- `README.md` and `docs/manual.html`.
- External: the private GitHub repo `knowledge`, created outside this change. Existing run knowledge moves from `~/.claude/experiments/knowledge`; the old path is removed once the new `knowledge_root` is live.
