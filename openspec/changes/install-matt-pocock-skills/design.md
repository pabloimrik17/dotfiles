## Context

The dotfiles repository already installs Claude Code plugins in Group 8 and user-scope skills.sh packages in Group 9 of `run_onchange_install-packages.sh.tmpl`. It also already registers `claude-plugins-official` with marketplace auto-updates and refreshes all skills.sh globals from the `update-extra` command. See `proposal.md` for motivation and scope.

Matt Pocock publishes the same skill collection through two channels. The Claude Code plugin namespaces its commands by plugin name, while skills.sh stores global skill bodies under flat names and exposes them to selected agents. That difference matters because the existing CodeRabbit installation already owns the flat global name `code-review`.

Current skills.sh releases accept repeated `--skill` options and a variadic `--agent <agents>` list, and have native global targets for both OpenCode and Junie. This permits agent scoping without custom symlink management.

## Goals / Non-Goals

**Goals:**

- Use the upstream-supported distribution path best suited to each agent.
- Preserve one managed Matt skill exposure per agent while retaining CodeRabbit as the flat `code-review` provider.
- Reuse the repository's existing idempotency, failure isolation, update, and fallback patterns.
- Keep the selected skill set and agent scope auditable in the templates.

**Non-Goals:**

- Automatically run Matt's per-project onboarding skill.
- Automatically add future upstream skills that are not in the explicit selection.
- Destructively remove pre-existing user-managed skill links.
- Add a marketplace, update step, version pin, or custom Junie symlink implementation.

## Decisions

### Use the official Claude Code plugin for all 25 skills

Add `mattpocock-skills@claude-plugins-official` to Group 8 and enable it in the merged Claude settings. Plugin namespacing makes `/mattpocock-skills:code-review` coexist safely with the existing standalone `/code-review`, and the already configured official marketplace supplies automatic updates.

The 25 is the length of the `skills` array in the plugin manifest (v1.2.3), not a count of `SKILL.md` files: the repository holds 35, including `in-progress/` and `misc/` bodies the manifest does not expose. The Group 9 selection of 24 is exactly that array minus `code-review`. A version bump that changes the array silently invalidates both the count and that equivalence, so re-read the manifest when the plugin updates. The same bump can also change how many of those bodies carry `disable-model-invocation: true` — 14 of the 25 at v1.2.3, leaving 11 model-invocable — so re-read the frontmatter too and update the split published in the Claude Code row of the `docs/manual.html` "Matt Pocock skills" table.

The alternative was to install standalone Matt skills for Claude Code as well. Upstream explicitly warns that combining standalone and plugin distributions duplicates every skill, so the standalone channel will not target Claude Code.

### Install an explicit 24-skill standalone set for OpenCode and Junie

Add each selected skill through Group 9 with the agent list `opencode junie`. Keep per-skill operations so the existing pre-scan can skip names that already cover both agents and one failed network operation does not prevent later skills from installing. The default skills.sh symlink mode remains responsible for canonical bodies and agent-specific exposure.

The alternatives were an all-skills selector or a single batched operation. Selecting all skills would include the conflicting `code-review` name and would silently expand the managed set when upstream adds skills. One batch would reduce process startup overhead but weaken per-skill failure isolation and diagnostics.

### Reserve flat `code-review` for CodeRabbit

Do not add Matt's standalone `code-review` to Group 9 or to the non-macOS skills.sh command. This protects the existing `~/.agents/skills/code-review` ownership and leaves OpenCode and Junie with one unambiguous default. Claude Code still receives Matt's review workflow through the plugin namespace.

Renaming Matt's standalone skill locally was rejected because it would fork upstream metadata and update behavior. Overwriting CodeRabbit was rejected because it would change an established capability outside DOT-17.

### Scope new skills.sh commands instead of managing links directly

Use skills.sh's native agent identifiers rather than creating `~/.junie/skills` or OpenCode links in shell code. Explicit agent flags also ensure fresh managed installs do not create `~/.claude/skills` links.

Automatic cleanup of stale Claude links is intentionally excluded. The installer may report them, and verification will provide the scoped removal command, but it will not delete user-managed state without consent.

### Reuse existing update mechanisms

Do not alter `dot_zshrc.tmpl`: its generic global skills update already covers the standalone records. Do not add another official marketplace entry or alter its settings because `claude-plugins-official` already has `autoUpdate: true`. Neither channel exposes a repository version coordinate suitable for Renovate.

### Keep fallback output explicit

The non-macOS section will print the Claude plugin command and one skills.sh command with repeatable `--skill` arguments plus the two agent targets. It will not use `--skill '*'`, ensuring the fallback preserves the same collision policy as the managed macOS path.

### Accept repeated reinstalls where jq is absent

`skill_installed()` returns 1 whenever the call requests agents and `jq` is missing. Without `jq` the `agents` array of `skills list --json` cannot be inspected, so a name-only match would report "installed" for a record that covers none of the requested agents and the missing coverage would never be reconciled. Correctness over speed: the accepted cost is that all 25 agent-scoped Group 9 entries — the 24 Matt standalone skills plus the pre-existing `gluestack-ui-v5` — reinstall on those machines.

The alternatives were adding `jq` to `BREW_PACKAGES`, reusing the `uv run --no-project python` engine of `modify_settings.json.tmpl`, and narrowing the `return 1`. Adding `jq` only equips the platform that already has `/usr/bin/jq`, not the Linux where it is absent. A second JSON engine adds a parser to Group 9 for a skip check, not for a fail-closed merge. Any narrowing reintroduces the unreconciled-coverage case the branch exists to prevent.

## Risks / Trade-offs

- [Future flat-name collision among the 24 selections] -> The existing name pre-scan protects the current owner rather than overwriting it; verification checks source metadata, and a future collision requires an explicit policy decision.
- [Upstream adds another skill] -> Explicit selection favors stability over automatic expansion; update the list through a reviewed dotfiles change.
- [Twenty-four separate skills.sh operations increase installation time] -> Preserve Group 9's per-skill failure isolation; the onchange script runs only when its rendered content changes.
- [Plugin and standalone channels update at different times] -> Accept temporary drift because both remain upstream-managed and `update-extra` gives the user an explicit standalone refresh path.
- [skills.sh CLI flags or target paths change] -> Rendered-command and live registry verification catches incompatibility before considering custom link logic.
- [A prior unscoped install left Matt links in Claude Code] -> Report the stale exposure and offer a scoped `skills remove` command for the 24 selected names; never include `code-review` in that cleanup.
- [Junie does not discover a generated link despite current CLI support] -> Verify discovery on the live machine; treat an upstream regression as follow-up work rather than adding speculative fallback code.
- [Without jq the skip check never matches an agent-scoped skill] -> Accept reinstalling all 25 agent-scoped entries, `gluestack-ui-v5` included even though it predates DOT-17; this is the usual path on Linux, where `jq` is absent, and the cost is bounded because `run_onchange` runs only when the rendered installer changes.

## Migration Plan

1. Add and enable the official plugin before adding standalone skills, so Claude Code has its intended channel throughout the migration.
2. Add the explicitly scoped Group 9 entries and equivalent non-macOS fallback.
3. Render and validate both templates, then apply the configuration twice to verify idempotency.
4. Inspect plugin and skills.sh registries for source ownership, target agents, and duplicates. If stale Matt standalone Claude links exist, report the exact scoped removal command and require user confirmation before running it.
5. Roll back by removing the managed configuration entries, uninstalling the plugin, and removing the 24 Matt skills only from the OpenCode and Junie targets.
