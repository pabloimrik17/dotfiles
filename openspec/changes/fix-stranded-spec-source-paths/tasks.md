## 1. Scope

- [x] 1.1 Re-derive the stranded set from `openspec/specs/` rather than trusting the parent change's count: group every `settings.json.tmpl` reference into its enclosing `### Requirement:` block, then subtract the requirements `brew-upgrade-and-claude-settings` already restates. Result: 18 across 5 capabilities (`claude-user-preferences` 8, `claude-code-plugins` 7, `claude-hud-config` 1, `mcp-global-config` 1, `worktrunk-claude-plugin` 1)
- [x] 1.2 Confirm `claude-hooks` nets to zero — all three of its stale references sit in requirements the parent change removes or restates — and exclude it
- [x] 1.3 Confirm the 18 are semantically satisfied by `dot_claude/modify_settings.json.tmpl`, so this change carries no implementation task: the managed key set holds every mandated key, the SuperWhisper `{{ if }}` guards survive alongside an explicit `REMOVE` list, and the file declares no `mcpServers`

## 2. Author the deltas

Extract each requirement from its main spec verbatim, then apply the substitutions — never retype a requirement by hand.

- [x] 2.1 `specs/claude-user-preferences/spec.md` — 8 MODIFIED requirements
- [x] 2.2 `specs/claude-code-plugins/spec.md` — 7 MODIFIED requirements
- [x] 2.3 `specs/claude-hud-config/spec.md` — 1 MODIFIED requirement
- [x] 2.4 `specs/mcp-global-config/spec.md` — 1 MODIFIED requirement
- [x] 2.5 `specs/worktrunk-claude-plugin/spec.md` — 1 MODIFIED requirement
- [x] 2.6 Match the parent change's delta conventions: no `# <capability> Specification` title, and no `## Purpose` — every capability here already exists
- [x] 2.7 Correct two clauses that describe the source wrongly instead of restating them verbatim: `claude-code-plugins` :: "SuperWhisper marketplace is registered on Apple Silicon" said *leading* comma where `dot_claude/modify_settings.json.tmpl:184-185` closes the entry with `},` **inside** the guard, i.e. trailing; and `claude-hud-config` :: "Statusline command sets COLUMNS for subprocess mode" said the command *prefixes* the bun invocation where `:386` exports `COLUMNS=200` as the first statement of the same `bash -c`, ahead of the bun `exec`. Both predate the rename, but `MODIFIED` replaces the main requirement wholesale, so restating them verbatim would publish false normative text under this change. 3.1's intended-substitution set admits exactly these two lines and no others. Left alone: the `COLUMNS=200`-before-the-bun-binary-path scenario, which the export satisfies

## 3. Verify the restatements

`MODIFIED` replaces the main requirement wholesale, so anything left out is deleted at archive time. Verify mechanically; reading them over does not count.

- [x] 3.1 Diff each delta requirement body against the exact line range of its main-spec block; assert every differing line carries one of the intended substitutions and nothing else. Result: 18/18, zero unintended lines
- [x] 3.2 Assert added and removed line counts are equal per requirement — a restatement that drops a scenario or a bullet is otherwise invisible in a summary diff
- [x] 3.3 Assert `#### Scenario:` counts, list-item bullet counts, and fenced-code-block counts are preserved per requirement, so the dropped-scenario and dropped-parenthetical failures caught in the parent change cannot repeat here
- [x] 3.4 Assert every `### Requirement:` name is byte-identical to its main-spec heading, so each operation resolves as MODIFIED rather than RENAMED or unmatched
- [x] 3.5 Confirm the delta requirement sets are disjoint from `brew-upgrade-and-claude-settings` for the two capabilities both changes touch
- [x] 3.6 Confirm none of the 18 is renamed or removed by `brew-upgrade-and-claude-settings`, which archives first — a `MODIFIED` header naming a requirement that change has already renamed away would not resolve. Cross-check against its `RENAMED` **and** `REMOVED` blocks, matching `- FROM:`/`- TO:` bullet syntax as well as `### Requirement:` headings: a parser that only reads headings reports zero renames for a delta that has one. Its full inventory is 3 operations — `claude-user-preferences` renames "User-preference keys appear in canonical order" → "User-preference keys are present with managed values", and `claude-hooks` removes the two `bd prime` requirements — and none is among the 18

## 4. Close out

- [x] 4.1 `openspec validate fix-stranded-spec-source-paths --strict`
- [x] 4.2 `openspec validate --all --strict` — the parent change must not regress
- [x] 4.3 `bunx oxfmt --check --ignore-path .oxfmtignore`
- [x] 4.4 Commit on `brew-update`; no push
- [ ] 4.5 Archive **after** `brew-upgrade-and-claude-settings` — the parent creates the `claude-settings-merge` capability these restatements presuppose, and archiving out of order writes the new paths into specs whose mechanism has not landed
