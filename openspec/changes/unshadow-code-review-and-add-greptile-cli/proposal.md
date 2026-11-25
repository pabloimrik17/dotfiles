# Proposal

## Why

The autonomous plugin's review team (DOT-163) runs Claude Code's built-in `/code-review`, but the dotfiles install CodeRabbit's skill under the same flat name, and a user skill with a built-in's flat name shadows it (coderabbitai/skills#18): `/code-review` runs CodeRabbit. DOT-163's calibration cannot run until the name is free. The official `code-review@claude-plugins-official` plugin stops on draft pull requests and repeats what the built-in does, and the Greptile CLI is missing, so calibration cannot measure it.

## What Changes

- CodeRabbit's `code-review` skill is installed as `coderabbit-review` through skills.sh `--rename`, for the same agents as today. Upstream is moving to that name (coderabbitai/skills#83); beads `agentic-task-8817` drops the rename once it merges. `autofix` and the CodeRabbit CLI stay.
- On machines that already have it, the old `code-review` is removed once `coderabbit-review` is installed, and only when skills.sh records it as CodeRabbit's and not renamed.
- Matt Pocock's `code-review` joins his standalone set for OpenCode and Junie (23 → 24 skills). It installs only after that removal and only when no `code-review` from another source remains. The rule that CodeRabbit owns the flat name goes.
- The skills group warns when `~/.claude/skills/code-review` exists at its end.
- `code-review@claude-plugins-official` is no longer installed or enabled: a new list of removed plugins uninstalls it, and the managed settings delete its `enabledPlugins` key.
- The Greptile CLI is installed with `npm install -g greptile`, updates itself, and the manual block prints `greptile login`. It stays out of the brew freeze.

Out of scope: deleting `dot_claude/commands/review-team.md` and pointing the gh-dash `F` key, `ghd-aoe` and the claude shim at `/autonomous:review-team` (a separate task blocked by DOT-163), and whether Greptile joins the review team (DOT-163's calibration measures it).

## Capabilities

### New Capabilities

- `greptile-install`: installing and updating the Greptile CLI, with its login instruction.

### Modified Capabilities

- `coderabbit-skills`: the review skill is installed as `coderabbit-review`, and the old `code-review` is removed from existing machines.
- `matt-pocock-skills`: `code-review` joins the standalone selection for OpenCode and Junie, never Claude Code; the flat-name rule and the manual fallback follow.
- `claude-code-plugins`: plugins removed without a replacement are uninstalled and their `enabledPlugins` key deleted; `code-review@claude-plugins-official` is the first.

## Impact

- `run_onchange_install-packages.sh.tmpl`: agent-skills group (rename, guarded removal, cache refresh, Matt's `code-review`, warning), plugin group (`CC_PLUGINS`, new removed list), a Greptile group after fallow, manual and non-macOS blocks.
- `dot_claude/modify_settings.json.tmpl`: `enabledPlugins` entry dropped, `REMOVE` entry added.
- `tests/install-script.test.ts`: rendered arrays and lines.
- Docs: `README.md` (Greptile CLI row), `docs/manual.html` (CodeRabbit flat-name text, skill names), `.agents/skills/sync-agent-config/parity.md` (24 skills, flat-name note).
- Machines: the personal Mac already had the skills part and the Greptile CLI applied by hand on 2026-11-22 to unblock DOT-163; the install script must reach the same state there as a no-op.
