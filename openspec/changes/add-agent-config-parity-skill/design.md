## Context

See `proposal.md` — Why. Facts established while scoping, which the decisions below rest on:

- **Discovery, verified against each tool's docs.** Claude Code reads enterprise / personal `~/.claude/skills/` / project `.claude/skills/` / plugins, and nothing else — but it explicitly follows a symlinked `<skill-name>` entry and loads a target reachable from two locations once. OpenCode reads `.opencode/skills`, `.claude/skills`, and `.agents/skills` at project scope. Junie's docs claim `.junie/skills` plus `.agents/skills`, while JetBrains issue JUNIE-2381 ("Support .agents directory") is still open.
- **The layout already exists at user scope.** `gh skill install` and `skills.sh` put the body in `~/.agents/skills/<name>` and leave `~/.claude/skills/<name>` as a symlink to `../../.agents/skills/<name>` — see the `gh-skill-install` and `slidev-skill-install` capabilities. Repo-local skills are the outlier.
- **Current repo state.** Zero symlinks anywhere under `.agents/`, `.claude/`, `.junie/`, `.opencode/`, `.codex/`. Five independent generated copies of each `openspec-*` skill; `.codex/skills` is stale at `generatedBy: 1.7.0` against `1.10.0` elsewhere; `.agents/skills/.openspec-target` contains `codex`. The three repo-owned skills are hand-duplicated across `.claude/skills/` and `.junie/skills/`.
- **`openspec update` has no target selection.** It detects the agent directories present and rewrites its own per-tool copies.
- **Tooling that touches new paths.** `lint-staged` runs `oxfmt` over `"*"` with `--ignore-path .oxfmtignore`, which lists `.claude/`, `.codex/`, `.junie/`, `.opencode/` — but not `.agents/`. `.worktreeinclude` carries `.claude/` and `.claude/settings.local.json` into new worktrees, not `.agents/`.

## Goals / Non-Goals

**Goals:**

- One editable copy per repo-owned skill; every agent resolves to it.
- The new skill is born in the target layout, not migrated afterwards.
- Per-tool exposure is justified by that tool's documented discovery, and checked where the documentation is silent or contested.

**Non-Goals:**

- Touching generator-owned output (`openspec-*` skills, `.codex/skills`, `.agents/skills/.openspec-target`).
- Migrating `.claude/commands/` or `.junie/commands/`. Commands are a separate surface with different per-tool naming (`opsx/new.md` vs `opsx-new.md`); a symlink cannot bridge that rename.
- Populating the parity table. It ships empty by explicit instruction.
- Changing any user-scope config under `dot_claude/` or `dot_config/opencode/`. The skill only proposes.

## Decisions

**D1 — Canonical body in `.agents/skills/`, exposed by relative symlink.**
Alternatives: keep per-tool copies and add a sync script (adds a moving part, and the drift it fixes is the drift it can also introduce); make `.claude/skills/` canonical and symlink `.agents/skills/` into it (inverts the cross-agent convention, and OpenCode and Junie both prefer `.agents/`); hardlinks (invisible in `git status`, break on checkout). Symlinks are what the user-scope tooling already produces, git stores them natively, and Claude Code documents following them. Targets are **relative** (`../../.agents/skills/<name>`) so they survive worktrees and clones at any path.

**D2 — Symlink only where the tool cannot read `.agents/skills`.**
Claude Code gets one, because it demonstrably cannot. OpenCode gets none: it reads `.agents/skills` natively, so a `.opencode/skills` entry would be pure redundancy. Junie gets one **provisionally** — its documentation and JUNIE-2381 disagree, and a symlink is the failure-safe side of that disagreement (a redundant symlink is removable; a missing skill is silent). D2 is settled by the check in T-verify, not by re-reading the docs.

**D3 — Migration scope is repo-owned skills only.**
`update-manual`, `update-readme`, `classify-tool-updates`, plus the new `sync-agent-config`. Everything openspec generates stays as openspec writes it: `openspec update` would recreate a deleted copy and overwrite a symlink with a regular file on the next run, so a hand-migration there is not stable.

**D4 — The skill proposes; it never writes user-scope config unattended.**
Matches `classify-tool-updates`, `update-manual`, and `update-readme`. It matters more here than there: a cross-tool translation is a judgment call (a Claude Code permission rule and an OpenCode `permission` entry are not the same grammar), and this config is deployed to `$HOME` by chezmoi. A wrong unattended edit reaches the live machine on the next `chezmoi apply`.

**D5 — Parity table is a markdown table in the skill directory, shipped empty.**
Columns: capability, Claude Code surface, OpenCode surface, Junie surface, notes. A gap is recorded as an explicit "none" cell with a reason, never a blank — a blank cell is indistinguishable from "not investigated yet", which is exactly the ambiguity the table exists to remove. Markdown over JSON/YAML: the consumer is a model reading `parity.md` and a human reading a diff.

**D6 — Junie's user-scope surface is named but not created.**
The repository manages no Junie user-scope config today. The skill treats `~/.junie/` and `~/.agents/` as the surfaces to propose *into*, meaning its first Junie proposal will be "create this file" rather than "edit that file". No empty `dot_junie/` directory is added speculatively.

**D7 — `.oxfmtignore` gains `.agents/`.**
Its four sibling agent directories are already listed. Moving skill bodies into an unlisted directory would newly expose them to `oxfmt` through lint-staged's `"*"` glob; formatting a staged path that is a symlink also risks replacing the link with a regular file. Adding the entry keeps the new canonical directory on the same footing as the ones it replaces.

## Risks / Trade-offs

- **A tool double-lists a skill reachable via both `.agents/skills` and a symlink** → Claude Code documents deduplication by target; OpenCode and Junie do not. Verified per tool before the change is accepted; the redundant exposure is removed from whichever tool double-lists.
- **Junie turns out not to read `.agents/skills` at all** (JUNIE-2381 open) → the `.junie/skills` symlink already covers that case; this is the reason it is created rather than skipped.
- **`openspec update` reintroduces per-tool copies** → only for its own `openspec-*` skills, which D3 leaves alone. Confirmed by running `openspec update` after the migration and checking that no repo-owned body or symlink moved.
- **oxfmt clobbers a symlink into a regular file** → D7. Confirmed by staging a symlinked skill and checking the file mode survives the pre-commit hook.
- **Symlinks are hostile to Windows checkouts without `core.symlinks`** → accepted. The README supports macOS and Linux only, and user-scope tooling already ships symlinks into `~/.claude/skills`.
- **`.worktreeinclude` does not carry `.agents/`** → it lists `.claude/` for untracked local files (`settings.local.json`). Skill bodies and symlinks are tracked, so `git worktree` materializes them regardless. No change needed; noted so a future reader does not mistake the omission for a bug.
- **A skill body edited through the `.claude/skills/` symlink writes to the canonical file** → intended, and the whole point; called out because a diff will show a path the editor never typed.

## Migration Plan

Per skill, in one commit so no intermediate state has a skill discoverable by zero tools:

1. `git mv` the body from `.claude/skills/<name>/` to `.agents/skills/<name>/`.
2. Create `.claude/skills/<name>` → `../../.agents/skills/<name>` and `.junie/skills/<name>` → `../../.agents/skills/<name>`.
3. Delete the duplicated `.junie/skills/<name>/` body (it is a copy, not a rename — the `git mv` in step 1 already preserved history through the `.claude` path).

Rollback: `git revert`. The symlinks are the only new file type and they carry no state.

## Open Questions

None. The two unknowns that remain — per-tool double-listing and Junie's `.agents` support — are resolved by verification tasks inside this change, not deferred past it; D2 already fixes what to do with either answer.
