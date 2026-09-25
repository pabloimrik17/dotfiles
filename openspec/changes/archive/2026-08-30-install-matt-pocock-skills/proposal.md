# Proposal: install-matt-pocock-skills

## Why

Linear DOT-17: Matt Pocock's engineering skills (`grill-me`, `tdd`, `diagnosing-bugs`, `code-review`, `implement`, `to-spec`, and others from [mattpocock/skills](https://github.com/mattpocock/skills)) should be available in Claude Code, OpenCode, and Junie and managed from this dotfiles repo like the other user-scope tools. Upstream provides an official Claude Code plugin and skills.sh-compatible standalone skills, while this repo already manages both distribution mechanisms. The remaining work is to connect each agent to the appropriate upstream channel without creating duplicate or conflicting skills.

## What Changes

- **Claude Code plugin track.** Install and enable `mattpocock-skills@claude-plugins-official` through Group 8. Claude Code receives all 25 upstream skills as plugin-namespaced commands, including `/mattpocock-skills:code-review`. The official marketplace is already registered with `autoUpdate: true`, so no marketplace configuration is added.
- **Scoped OpenCode and Junie track.** Extend Group 9 to install 24 explicitly selected standalone skills from `mattpocock/skills`. Every skills.sh add operation targets only `opencode` and `junie`, preserving canonical global bodies while preventing standalone Claude Code exposure.
- **Flat-name collision policy.** Exclude Matt's standalone `code-review` from Group 9. The existing CodeRabbit `code-review` remains the sole flat `code-review` skill for OpenCode and Junie, while Claude Code can also use Matt's namespaced plugin command without collision.
- **Explicit selection.** Install `ask-matt`, `diagnosing-bugs`, `grill-with-docs`, `triage`, `improve-codebase-architecture`, `setup-matt-pocock-skills`, `tdd`, `to-spec`, `to-tickets`, `wayfinder`, `implement`, `prototype`, `research`, `domain-modeling`, `codebase-design`, `resolving-merge-conflicts`, `wizard`, `grill-me`, `grilling`, `handoff`, `teach`, `to-questionnaire`, `wait-what`, and `writing-for-agents` for OpenCode and Junie.
- **Existing update paths.** The official marketplace refreshes the plugin, and the existing `update-extra` command's `npx -y skills update -g -y` step refreshes the standalone skills. No new update step or Renovate pin is introduced.
- **Non-macOS fallback.** Extend the manual-instructions output with the plugin command and an explicitly scoped skills.sh command containing the same 24-skill selection.
- **Out of scope.** Running `setup-matt-pocock-skills` inside individual projects remains a manual, per-project action.

## Capabilities

### New Capabilities

- `matt-pocock-skills`: manages the selected standalone Matt Pocock skills for OpenCode and Junie, including explicit agent scope, idempotent installation, flat-name collision avoidance, and manual fallback instructions.

### Modified Capabilities

- `claude-code-plugins`: adds installation and default enablement of `mattpocock-skills@claude-plugins-official`, using the already registered auto-updating official marketplace.

`skills-global-install` and `extra-updates-command` are intentionally not modified: Group 9 already provides the generic global-install mechanism, and `update-extra` already refreshes all skills.sh globals. A `sync-agent-config` parity-table row is an implementation documentation task, not a capability change.

## Impact

- **Code / config:**
  - `run_onchange_install-packages.sh.tmpl` — Group 8 plugin entry; scoped Group 9 installation of the 24 selected skills; non-macOS fallback text.
  - `dot_claude/modify_settings.json.tmpl` — `"mattpocock-skills@claude-plugins-official": true` in `enabledPlugins` (alphabetical position).
  - `.agents/skills/sync-agent-config/parity.md` — mapping row for the plugin and scoped skills.sh channels, including the `code-review` exception.
- **Specs:** a new `matt-pocock-skills` capability and an additive `claude-code-plugins` delta.
- **Docs follow-up during implementation** via the existing `update-manual` / `update-readme` skills (manual's skills table lists user-scope and plugin skills).
- **Verification:** render and syntax-check the templates, apply twice, inspect the Claude plugin and global skill registries, confirm all 24 standalone skills target OpenCode and Junie but not Claude Code, and confirm CodeRabbit still owns flat `code-review`.
- **Migration:** existing unmanaged Matt standalone links exposed to Claude Code are reported rather than deleted automatically; they can be removed safely with a scoped skills.sh removal that excludes `code-review`.
- **Rollback:** remove the plugin settings and install entries plus the 24 Group 9 entries, uninstall the plugin, and use skills.sh to remove only Matt's selected skills from the OpenCode and Junie targets.
