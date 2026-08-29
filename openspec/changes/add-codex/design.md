## Context

See `proposal.md` for motivation. The package installer already has a confirmation-gated, non-fatal group for tools distributed by official installers and exports `~/.local/bin` before that group runs. Codex's standalone installer places its command there but keeps distribution files and mutable runtime state under `~/.codex`.

Repo-owned and globally installed skills already use `.agents/skills` as their canonical location. Codex reads that location directly, while Claude Code uses compatibility symlinks. The repository also contains generator-owned `.codex/skills` output that is not part of the canonical-skill migration.

The configuration parity skill currently models three tools and owns an empty parity table. The HTML manual currently contains 13 sections even though its specification still says 12; adding Codex requires reconciling the existing drift rather than merely appending to the stale count.

## Goals / Non-Goals

**Goals:**

- Integrate Codex into existing installer, skill, parity, and documentation structures rather than creating parallel mechanisms.
- Make installation and migration rerunnable without risking an existing working Codex installation or mutable user state.
- Keep every Codex claim tied to behavior this repository actually ships.
- Leave implementation surfaces ready for future Codex user configuration without creating empty or speculative config files now.

**Non-Goals:**

- Register MCP servers with Codex or claim parity for transport- or plugin-specific integrations.
- Manage `~/.codex/config.toml`, authentication, sessions, logs, or command rules with chezmoi.
- Modify or remove OpenSpec-generated `.codex/skills` output.
- Add Codex to `update-extra` or install it through Homebrew/npm.
- Evaluate `codex completion zsh` automatically on every shell startup.

## Decisions

### Use the official installer group with direct-path verification

Codex will join the existing official-installer group. Pending work is determined from the official executable at `~/.local/bin/codex` plus evidence of a Homebrew cask or global npm installation. A standalone installation with no migration pending is skipped before prompting.

For a fresh install or migration, the script runs OpenAI's installer with `CODEX_NON_INTERACTIVE=1` and verifies the resulting executable by its absolute path. Only after that verification succeeds may it remove a detected Homebrew cask or global npm package. This order prevents a failed network install from taking away a working CLI and avoids accidentally validating the old package-manager binary through PATH.

Installation, verification, and cleanup failures use the group's existing logging and error counter. Failure remains non-fatal. The script does not delete or reset `~/.codex`; the upstream installer remains free to maintain its own distribution files there.

Installing Codex through Homebrew would simplify cask migration but would contradict OpenAI's preferred distribution and the repository's self-updating-tool policy. Installing through npm would add a Node runtime dependency to a CLI that provides a standalone build. Both alternatives are rejected.

### Reuse the existing PATH and document completion on demand

No zsh PATH change is needed because both the setup process and `dot_zshrc.tmpl` already prepend `~/.local/bin`. This also makes Codex available to later groups in the same installer run.

The manual will document `codex completion zsh` rather than adding an unconditional shell-startup `eval`. This keeps baseline installation free of a new process invocation on every interactive shell while still exposing the supported completion workflow.

### Keep Codex runtime configuration outside chezmoi

The existing `.codex/` ignore remains in place. No `dot_codex` source is created, because Codex persists mutable state and this change has selected no durable preference, MCP registration, or command rule to own. The parity skill will recognize a future `dot_codex/**` source so the first concrete configuration change enters the four-tool workflow automatically.

A static whole-file `config.toml` template was considered and rejected because it could overwrite settings written by Codex. A future change that selects concrete preferences should use merge-preserving ownership and narrowly revise the ignore rule.

### Use `.agents/skills` directly for Codex

Repo-owned skills remain regular files under `.agents/skills`; global skills such as Slidev remain under `~/.agents/skills`. Codex discovers both canonical locations directly, so no `.codex/skills` or `~/.codex/skills` compatibility entries are created. Claude Code's existing relative symlinks remain unchanged.

Generator-owned OpenSpec output under `.codex/skills` is deliberately left untouched. Hand-editing or migrating it would cross ownership boundaries and would be undone by generator updates.

### Expand parity as a four-tool matrix without inventing mappings

The synchronization skill will enumerate Claude Code, Codex, OpenCode, and Junie in every analysis. Its proposal shape must contain either a concrete edit or an explicit gap for each of the other three tools. The parity table gains a Codex column but remains row-empty until the workflow establishes real mappings.

The skill's trigger scope gains future `dot_codex/**` user configuration while explicitly excluding project `.codex/**`. Changes to the Codex installer itself are installation changes, not user-configuration parity events. Existing evals will be expanded to cover a Codex-origin change, a missing Codex counterpart, four-tool proposal completeness, and project `.codex` exclusion.

### Reconcile documentation around a 14-section manual

Codex becomes Section 13 and the existing Agent Sessions section moves from 13 to 14. Sidebar links, section labels, search-visible content, and print expectations will use the same count. The Codex section will cover standalone installation, first-run authentication, self-update, completion generation, `AGENTS.md`, `.agents/skills`, and basic CLI entry points only.

The canonical `update-manual` skill and command-facing copies will map the installer stanza and any future `dot_codex/**` source to Section 13. README updates will add Codex to the introduction, AI Tooling table, and self-updating list; no separate README capability delta is needed because its existing contract already covers all managed tools.

## Risks / Trade-offs

- **Upstream installer behavior changes** -> Pin behavior to observable postconditions, verify `~/.local/bin/codex` directly, and keep failure non-fatal.
- **Package-manager detection misses an unusual installation** -> Handle the documented Homebrew cask and global npm package explicitly; leave unknown copies untouched rather than deleting by command name.
- **Migration affects mutable Codex state** -> Never remove or recreate `~/.codex`; remove only the detected package-manager distribution after standalone verification.
- **Generator-owned Codex skills remain stale or duplicated** -> Preserve generator ownership and exclude that tree from repo-owned skill assertions; address generator refresh/removal in a separate change.
- **A fourth manual section increases print density** -> Retain the 2-4 page target, keep tables and subsection-sized blocks together, and allow oversized top-level sections to flow across columns rather than forcing unreadably small type.
- **An empty Codex parity column offers no immediate mappings** -> Prefer explicit unknowns over speculative equivalence; mappings are added only after a real config change is researched and confirmed.

## Migration Plan

1. Extend the official-installer group with Codex detection, install, verification, guarded legacy cleanup, error accounting, and manual fallback text.
2. Update canonical skill layout assertions, Slidev availability wording, the synchronization skill, its parity header, and its eval cases.
3. Update the manual-maintenance skill and command copies, README, and the 14-section HTML/print manual.
4. Validate OpenSpec artifacts, shell/template syntax, skill parity, documentation structure, and print behavior.

Rollback removes the managed installer and documentation changes but does not uninstall a verified standalone Codex installation or alter `~/.codex`; those are user/runtime state after installation. A failed migration leaves the prior package-manager installation in place.
