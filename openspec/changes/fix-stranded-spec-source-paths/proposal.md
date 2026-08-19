## Why

`brew-upgrade-and-claude-settings` renamed `dot_claude/settings.json.tmpl` to `dot_claude/modify_settings.json.tmpl`: the file stopped being a whole-file template and became a chezmoi `modify_` script that overlays a managed key set onto the live `~/.claude/settings.json`. That rename stranded **18 requirements across 5 capabilities** that still name the old source file.

All 18 are already satisfied by the shipped implementation. The keys they mandate are in the managed set, the host conditionals are still `{{ if }}`-guarded, and `mcpServers` is still absent. What is stale is the spec text: the filename in all 18, plus two clauses that misdescribe the source (see What Changes). Nothing is broken at runtime, and nothing needs to be built.

The parent change deliberately did not widen its scope to cover them; its `Impact` section names this change as the handler.

## What Changes

- Repoint every stranded reference from `dot_claude/settings.json.tmpl` to `dot_claude/modify_settings.json.tmpl`.
- Adjust the minimum wording where a sentence describes the old mechanism and now reads wrong: the file no longer *contains* the JSON keys ("the chezmoi template SHALL include" → "the managed key set SHALL include"), and `~/.claude/settings.json` is no longer *rendered* from it but materialized by the merge.
- Correct two clauses that describe the source wrongly, both predating the rename: `claude-code-plugins` :: "SuperWhisper marketplace is registered on Apple Silicon" said the conditional block carries a *leading* comma where the source has always written a trailing one inside the guard, and `claude-hud-config` :: "Statusline command sets COLUMNS for subprocess mode" said the command *prefixes* the bun invocation where it exports `COLUMNS=200` as the first statement of the same `bash -c`. Both were previously deferred; they are fixed here because `MODIFIED` replaces the main requirement wholesale, so archiving the restatements verbatim would republish both falsehoods as this change's active contract.

Nothing beyond that. No scenario is added or removed, no requirement gains or loses a clause, and the only normative text that changes is the two corrections above. **The delta specs are the entire fix** — there is no implementation work, and `openspec/specs/` is left untouched because archiving the deltas is what updates it.

Explicitly **not** in scope:

- `claude-hooks`, whose three stale references need no follow-up: two belong to requirements `brew-upgrade-and-claude-settings` removes, the third to the one it restates. It nets to zero.
- `claude-user-preferences` :: "User-preference keys appear in canonical order" and `claude-code-plugins` :: "Beads marketplace is registered" — both already restated by the parent change against the new path.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `claude-user-preferences` (8 requirements): the five user-preference keys, `permissions.defaultMode`, `permissions.deny` and `attribution` are declared in the managed key set of `dot_claude/modify_settings.json.tmpl`.
- `claude-code-plugins` (7 requirements): the Plannotator, Expo, beads, code-simplifier, SuperWhisper and Commander entries — plus the SuperWhisper marketplace — name the renamed settings dotfile.
- `claude-hud-config` (1 requirement): the `statusLine.command` requirement names the renamed dotfile and describes it as managed rather than templated.
- `mcp-global-config` (1 requirement): both references to the settings source in the "no `mcpServers` key" rule.
- `worktrunk-claude-plugin` (1 requirement): the apply scenario names the renamed dotfile.

## Impact

- **Code touched**: none. No dotfile, script, or config changes.
- **Runtime effect**: none. Every restated requirement is already satisfied; a verify pass against the implementation passes before and after.
- **Ordering**: ships on the `brew-update` branch in the same PR as `brew-upgrade-and-claude-settings`, and MUST be archived after it. The parent creates the `claude-settings-merge` capability these restatements presuppose.
- **Delta overlap**: none. `claude-user-preferences` and `claude-code-plugins` carry deltas in both changes, but the requirement sets are disjoint — verified by name against both delta files.
- **Archive risk**: `MODIFIED` replaces the main requirement wholesale, so an incomplete restatement silently deletes content. Each of the 18 was diffed against its exact main-spec line range; the task list records that check as the change's real work.
